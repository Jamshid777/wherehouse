
import React, { useState, useMemo } from 'react';
import { Warehouse } from '../types';
import { UseMockDataReturnType } from '../hooks/useMockData';
import { Modal } from './Modal';
import { PlusIcon } from './icons/PlusIcon';
import { EditIcon } from './icons/EditIcon';
import { TrashIcon } from './icons/TrashIcon';

interface WarehousesViewProps {
  dataManager: UseMockDataReturnType;
}

export const WarehousesView: React.FC<WarehousesViewProps> = ({ dataManager }) => {
  const { warehouses, addWarehouse, updateWarehouse, deleteWarehouse } = dataManager;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);

  const handleOpenModal = (warehouse: Warehouse | null = null) => {
    setEditingWarehouse(warehouse);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingWarehouse(null);
  };

  const handleSubmit = (formData: Omit<Warehouse, 'id'> | Warehouse) => {
    if ('id' in formData) {
      updateWarehouse(formData);
    } else {
      addWarehouse(formData);
    }
    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Haqiqatan ham bu omborni o'chirmoqchimisiz? Undagi qoldiqlar bo'lmasligi kerak.")) {
      deleteWarehouse(id);
    }
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Omborlar Ro'yxati</h2>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2.5 rounded-lg hover:bg-blue-600 transition-colors shadow"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Yangi ombor</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 tracking-wider">
            <tr>
              <th scope="col" className="px-6 py-3">Nomi</th>
              <th scope="col" className="px-6 py-3">Manzili</th>
              <th scope="col" className="px-6 py-3">Holati</th>
              <th scope="col" className="px-6 py-3 text-center">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {warehouses.map(warehouse => (
              <tr key={warehouse.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-900">{warehouse.name}</td>
                <td className="px-6 py-4 text-slate-600">{warehouse.location}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${warehouse.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {warehouse.is_active ? 'Faol' : 'Faol emas'}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex justify-center items-center gap-2">
                     <button onClick={() => handleOpenModal(warehouse)} className="p-2 rounded-full text-blue-600 hover:bg-blue-50 transition-colors"><EditIcon className="h-5 w-5"/></button>
                    <button onClick={() => handleDelete(warehouse.id)} className="p-2 rounded-full text-red-600 hover:bg-red-50 transition-colors"><TrashIcon className="h-5 w-5"/></button>
                  </div>
                </td>
              </tr>
            ))}
             {warehouses.length === 0 && (
                <tr>
                    <td colSpan={4} className="text-center py-10 text-slate-500">
                        Omborlar mavjud emas.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      <WarehouseFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        warehouse={editingWarehouse}
      />
    </div>
  );
};

interface WarehouseFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Omit<Warehouse, 'id'> | Warehouse) => void;
    warehouse: Warehouse | null;
}

const WarehouseFormModal: React.FC<WarehouseFormModalProps> = ({isOpen, onClose, onSubmit, warehouse}) => {
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        is_active: true,
    });

    React.useEffect(() => {
        if(warehouse){
            setFormData({
                name: warehouse.name,
                location: warehouse.location,
                is_active: warehouse.is_active,
            });
        } else {
            setFormData({
                name: '', location: '', is_active: true,
            });
        }
    }, [warehouse, isOpen]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({...prev, [name]: type === 'checkbox' ? checked : value}));
    }

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(warehouse){
            onSubmit({...formData, id: warehouse.id});
        } else {
            onSubmit(formData);
        }
    }
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={warehouse ? "Omborni tahrirlash" : "Yangi ombor qo'shish"}>
            <form onSubmit={handleFormSubmit} className="space-y-4">
                 <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Ombor nomi</label>
                    <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500" />
                </div>
                 <div>
                    <label htmlFor="location" className="block text-sm font-medium text-slate-700 mb-1">Joylashuvi</label>
                    <input type="text" name="location" id="location" value={formData.location} onChange={handleChange} required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500" />
                </div>
                <div className="flex items-center">
                    <input type="checkbox" name="is_active" id="is_active" checked={formData.is_active} onChange={handleChange} className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" />
                    <label htmlFor="is_active" className="ml-2 block text-sm text-slate-900">Faol</label>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200">Bekor qilish</button>
                    <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">Saqlash</button>
                </div>
            </form>
        </Modal>
    )
}
