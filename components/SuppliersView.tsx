
import React, { useState, useMemo } from 'react';
import { Supplier, DocumentStatus } from '../types';
import { UseMockDataReturnType } from '../hooks/useMockData';
import { PlusIcon } from './icons/PlusIcon';
import { EditIcon } from './icons/EditIcon';
import { TrashIcon } from './icons/TrashIcon';
import { SupplierFormModal } from './forms/SupplierFormModal';

interface SuppliersViewProps {
  dataManager: UseMockDataReturnType;
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('uz-UZ').format(amount);

export const SuppliersView: React.FC<SuppliersViewProps> = ({ dataManager }) => {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier, isInnUnique, goodsReceipts, payments, getNoteTotal } = dataManager;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  
  const supplierBalances = useMemo(() => {
    const balances = new Map<string, number>();
    suppliers.forEach(supplier => {
        const totalReceipts = goodsReceipts
            .filter(note => note.supplier_id === supplier.id && note.status === DocumentStatus.CONFIRMED)
            .reduce((sum, note) => sum + getNoteTotal(note.items), 0);
        
        const totalPayments = payments
            .filter(p => p.supplier_id === supplier.id)
            .reduce((sum, p) => sum + p.amount, 0);

        balances.set(supplier.id, supplier.initial_balance + totalReceipts - totalPayments);
    });
    return balances;
  }, [suppliers, goodsReceipts, payments, getNoteTotal]);


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
  
  const handleDelete = (id: string) => {
    if (window.confirm("Haqiqatan ham bu yetkazib beruvchini o'chirmoqchimisiz?")) {
      deleteSupplier(id);
    }
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Yetkazib beruvchilar</h2>
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
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 tracking-wider">
            <tr>
              <th scope="col" className="px-6 py-3 border-r border-slate-200">Nomi</th>
              <th scope="col" className="px-6 py-3 border-r border-slate-200">INN (STIR)</th>
              <th scope="col" className="px-6 py-3 border-r border-slate-200">Telefon</th>
              <th scope="col" className="px-6 py-3 text-right border-r border-slate-200">Kredit Limiti</th>
              <th scope="col" className="px-6 py-3 text-right border-r border-slate-200">Joriy Balans</th>
              <th scope="col" className="px-6 py-3 text-center">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {suppliers.map(supplier => {
                const balance = supplierBalances.get(supplier.id) || 0;
                const debt = Math.max(0, balance);
                const creditUsage = (supplier.credit_limit && supplier.credit_limit > 0) ? (debt / supplier.credit_limit) * 100 : 0;
                
                const usageColor = creditUsage > 90 ? 'bg-red-500' : creditUsage > 70 ? 'bg-yellow-400' : 'bg-green-500';

                return (
                    <tr key={supplier.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap border-r border-slate-200">{supplier.name}</td>
                        <td className="px-6 py-4 text-slate-600 border-r border-slate-200">{supplier.inn}</td>
                        <td className="px-6 py-4 text-slate-600 border-r border-slate-200">{supplier.phone}</td>
                        <td className="px-6 py-4 text-right font-mono text-slate-600 border-r border-slate-200">{formatCurrency(supplier.credit_limit || 0)}</td>
                        <td className="px-6 py-4 text-right border-r border-slate-200">
                            <div className="flex flex-col gap-1 items-end">
                                <div className={`font-mono font-semibold ${balance > 0 ? 'text-red-600' : balance < 0 ? 'text-green-600' : 'text-slate-800'}`}>
                                    {formatCurrency(balance)}
                                </div>
                                {supplier.credit_limit && supplier.credit_limit > 0 && (
                                    <div className="w-24 bg-slate-200 rounded-full h-2" title={`Limit ishlatilishi: ${creditUsage.toFixed(1)}%`}>
                                        <div 
                                            className={`h-2 rounded-full ${usageColor} transition-all duration-500`} 
                                            style={{width: `${Math.min(creditUsage, 100)}%`}}
                                        ></div>
                                    </div>
                                )}
                            </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center items-center gap-2">
                             <button onClick={() => handleOpenModal(supplier)} className="p-2 rounded-full text-amber-600 hover:bg-amber-50 transition-colors"><EditIcon className="h-5 w-5"/></button>
                            <button onClick={() => handleDelete(supplier.id)} className="p-2 rounded-full text-red-600 hover:bg-red-50 transition-colors"><TrashIcon className="h-5 w-5"/></button>
                          </div>
                        </td>
                    </tr>
                );
            })}
             {suppliers.length === 0 && (
                <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-500">
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
    </div>
  );
};
