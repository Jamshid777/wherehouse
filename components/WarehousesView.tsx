
import React, { useState, useMemo } from 'react';
import { Warehouse } from '../types';
import { UseMockDataReturnType } from '../hooks/useMockData';
import { PlusIcon } from './icons/PlusIcon';
import { EditIcon } from './icons/EditIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ConfirmationModal } from './ConfirmationModal';
import { WarehouseFormModal } from './forms/WarehouseFormModal';

interface WarehousesViewProps {
  dataManager: UseMockDataReturnType;
}

export const WarehousesView: React.FC<WarehousesViewProps> = ({ dataManager }) => {
  const { warehouses, addWarehouse, updateWarehouse, deleteWarehouse } = dataManager;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [warehouseToDelete, setWarehouseToDelete] = useState<string | null>(null);

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

  const handleDeleteClick = (id: string) => {
    setWarehouseToDelete(id);
  };

  const handleConfirmDelete = () => {
    if (warehouseToDelete) {
      deleteWarehouse(warehouseToDelete);
      setWarehouseToDelete(null);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Omborlar Ro'yxati</h2>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2.5 rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all shadow"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Yangi ombor</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50 tracking-wider">
            <tr>
              <th scope="col" className="px-6 py-3 font-medium border-r border-gray-200">Nomi</th>
              <th scope="col" className="px-6 py-3 font-medium border-r border-gray-200">Holati</th>
              <th scope="col" className="px-6 py-3 font-medium text-center">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {warehouses.map(warehouse => (
              <tr key={warehouse.id} className="hover:bg-amber-50">
                <td className="px-6 py-4 font-medium text-gray-900 border-r border-gray-200">{warehouse.name}</td>
                <td className="px-6 py-4 border-r border-gray-200">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${warehouse.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {warehouse.is_active ? 'Faol' : 'Faol emas'}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex justify-center items-center gap-2">
                     <button onClick={() => handleOpenModal(warehouse)} className="p-2 rounded-full text-amber-600 hover:bg-amber-50 transition-colors"><EditIcon className="h-5 w-5"/></button>
                    <button onClick={() => handleDeleteClick(warehouse.id)} className="p-2 rounded-full text-red-600 hover:bg-red-50 transition-colors"><TrashIcon className="h-5 w-5"/></button>
                  </div>
                </td>
              </tr>
            ))}
             {warehouses.length === 0 && (
                <tr>
                    <td colSpan={3} className="text-center py-10 text-gray-500">
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
      <ConfirmationModal
        isOpen={!!warehouseToDelete}
        onClose={() => setWarehouseToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Omborni o'chirish"
        message="Haqiqatan ham bu omborni o'chirmoqchimisiz? Undagi qoldiqlar bo'lmasligi kerak."
        confirmButtonText="Ha, o'chirish"
      />
    </div>
  );
};
