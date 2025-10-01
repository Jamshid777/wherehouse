
import React, { useState, useMemo } from 'react';
import { Supplier } from '../types';
import { UseMockDataReturnType } from '../hooks/useMockData';
import { PlusIcon } from './icons/PlusIcon';
import { EditIcon } from './icons/EditIcon';
import { TrashIcon } from './icons/TrashIcon';
import { SupplierFormModal } from './forms/SupplierFormModal';
import { ConfirmationModal } from './ConfirmationModal';

interface SuppliersViewProps {
  dataManager: UseMockDataReturnType;
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('uz-UZ').format(amount);

export const SuppliersView: React.FC<SuppliersViewProps> = ({ dataManager }) => {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier, isInnUnique, getSupplierBalance, canDeleteSupplier } = dataManager;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<string | null>(null);

  const handleOpenModal = (supplier: Supplier | null = null) => {
    setEditingSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSupplier(null);
  };

  const handleSubmit = (formData: Omit<Supplier, 'id'> | Supplier) => {
    if ('id' in formData) {
      updateSupplier(formData);
    } else {
      addSupplier(formData);
    }
    handleCloseModal();
  };
  
  const handleDeleteClick = (id: string) => {
    setSupplierToDelete(id);
  };

  const handleConfirmDelete = () => {
    if (supplierToDelete) {
      deleteSupplier(supplierToDelete);
      setSupplierToDelete(null);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Yetkazib beruvchilar</h2>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2.5 rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all shadow"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Yangi qo'shish</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50 tracking-wider">
            <tr>
              <th scope="col" className="px-6 py-3 font-medium border-r border-gray-200">Nomi</th>
              <th scope="col" className="px-6 py-3 font-medium border-r border-gray-200">INN (STIR)</th>
              <th scope="col" className="px-6 py-3 font-medium border-r border-gray-200">Telefon</th>
              <th scope="col" className="px-6 py-3 font-medium text-right border-r border-gray-200">Joriy Balans</th>
              <th scope="col" className="px-6 py-3 font-medium text-center">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {suppliers.map(supplier => {
                const balance = getSupplierBalance(supplier.id);
                const isDeletable = canDeleteSupplier(supplier.id);

                return (
                    <tr key={supplier.id} className="hover:bg-amber-50">
                        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap border-r border-gray-200">{supplier.name}</td>
                        <td className="px-6 py-4 text-gray-600 border-r border-gray-200">{supplier.inn || '-'}</td>
                        <td className="px-6 py-4 text-gray-600 border-r border-gray-200">{supplier.phone || '-'}</td>
                        <td className="px-6 py-4 text-right border-r border-gray-200">
                            <div className="flex flex-col gap-1 items-end">
                                <div className={`font-mono font-semibold ${balance > 0 ? 'text-red-600' : balance < 0 ? 'text-green-600' : 'text-gray-800'}`}>
                                    {formatCurrency(balance)}
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center items-center gap-2">
                             <button onClick={() => handleOpenModal(supplier)} className="p-2 rounded-full text-amber-600 hover:bg-amber-50 transition-colors"><EditIcon className="h-5 w-5"/></button>
                            <button 
                              onClick={() => handleDeleteClick(supplier.id)} 
                              disabled={!isDeletable}
                              title={!isDeletable ? "Bu ta'minotchi bilan bog'liq moliyaviy operatsiyalar mavjudligi sababli o'chirib bo'lmaydi." : "O'chirish"}
                              className="p-2 rounded-full text-red-600 hover:bg-red-50 transition-colors disabled:text-gray-400 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                            >
                                <TrashIcon className="h-5 w-5"/>
                            </button>
                          </div>
                        </td>
                    </tr>
                );
            })}
             {suppliers.length === 0 && (
                <tr>
                    <td colSpan={5} className="text-center py-10 text-gray-500">
                        Yetkazib beruvchilar mavjud emas.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      <SupplierFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        supplier={editingSupplier}
        isInnUnique={isInnUnique}
      />
      <ConfirmationModal
        isOpen={!!supplierToDelete}
        onClose={() => setSupplierToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Yetkazib beruvchini o'chirish"
        message="Haqiqatan ham bu yetkazib beruvchini o'chirmoqchimisiz?"
        confirmButtonText="Ha, o'chirish"
      />
    </div>
  );
};
