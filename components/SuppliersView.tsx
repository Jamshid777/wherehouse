
import React, { useState, useMemo } from 'react';
import { Supplier, DocumentStatus } from '../types';
import { UseMockDataReturnType } from '../hooks/useMockData';
import { Modal } from './Modal';
import { PlusIcon } from './icons/PlusIcon';
import { EditIcon } from './icons/EditIcon';
import { TrashIcon } from './icons/TrashIcon';

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
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2.5 rounded-lg hover:bg-blue-600 transition-colors shadow"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Yangi qo'shish</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 tracking-wider">
            <tr>
              <th scope="col" className="px-6 py-3">Nomi</th>
              <th scope="col" className="px-6 py-3">INN (STIR)</th>
              <th scope="col" className="px-6 py-3">Telefon</th>
              <th scope="col" className="px-6 py-3 text-right">Kredit Limiti</th>
              <th scope="col" className="px-6 py-3 text-right">Joriy Balans</th>
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
                        <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{supplier.name}</td>
                        <td className="px-6 py-4 text-slate-600">{supplier.inn}</td>
                        <td className="px-6 py-4 text-slate-600">{supplier.phone}</td>
                        <td className="px-6 py-4 text-right font-mono text-slate-600">{formatCurrency(supplier.credit_limit || 0)}</td>
                        <td className="px-6 py-4 text-right">
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
                             <button onClick={() => handleOpenModal(supplier)} className="p-2 rounded-full text-blue-600 hover:bg-blue-50 transition-colors"><EditIcon className="h-5 w-5"/></button>
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


interface SupplierFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Omit<Supplier, 'id'> | Supplier) => void;
    supplier: Supplier | null;
    isInnUnique: (inn: string, currentId?: string | null) => boolean;
}

const SupplierFormModal: React.FC<SupplierFormModalProps> = ({isOpen, onClose, onSubmit, supplier, isInnUnique}) => {
    const [formData, setFormData] = useState({
        name: '', inn: '', phone: '', address: '', initial_balance: 0, credit_limit: 0
    });
    const [innError, setInnError] = useState('');

    React.useEffect(() => {
        if(supplier){
            setFormData({
                name: supplier.name,
                inn: supplier.inn,
                phone: supplier.phone,
                address: supplier.address,
                initial_balance: supplier.initial_balance || 0,
                credit_limit: supplier.credit_limit || 0,
            });
        } else {
            setFormData({ name: '', inn: '', phone: '', address: '', initial_balance: 0, credit_limit: 0 });
        }
        setInnError('');
    }, [supplier, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev, 
            [name]: type === 'number' ? parseFloat(value) || 0 : value
        }));
        if(name === 'inn'){
            if(!isInnUnique(value, supplier?.id)){
                setInnError("Bu INN (STIR) allaqachon mavjud.");
            } else {
                setInnError('');
            }
        }
    }
    
    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(innError) return;
        if(supplier){
            onSubmit({...formData, id: supplier.id});
        } else {
            onSubmit(formData);
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={supplier ? "Yetkazib beruvchini tahrirlash" : "Yangi yetkazib beruvchi"}>
            <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Tashkilot nomi</label>
                    <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                    <label htmlFor="inn" className="block text-sm font-medium text-slate-700 mb-1">INN (STIR)</label>
                    <input type="text" name="inn" id="inn" value={formData.inn} onChange={handleChange} required className={`w-full px-3 py-2.5 border rounded-lg focus:ring-1 ${innError ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-blue-500'}`} />
                    {innError && <p className="text-xs text-red-600 mt-1">{innError}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">Telefon raqami</label>
                        <input type="text" name="phone" id="phone" value={formData.phone} onChange={handleChange} required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500" />
                    </div>
                     <div>
                        <label htmlFor="credit_limit" className="block text-sm font-medium text-slate-700 mb-1">Kredit Limiti</label>
                        <input type="number" step="any" name="credit_limit" id="credit_limit" value={formData.credit_limit} onChange={handleChange} required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500" />
                    </div>
                </div>
                 <div>
                    <label htmlFor="initial_balance" className="block text-sm font-medium text-slate-700 mb-1">Boshlang'ich qoldiq</label>
                    <input type="number" step="any" name="initial_balance" id="initial_balance" value={formData.initial_balance} onChange={handleChange} required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500" />
                    <p className="text-xs text-slate-500 mt-1">Qarzimiz bo'lsa musbat (+), bizga qarzi bo'lsa manfiy (-) kiriting.</p>
                </div>
                <div>
                    <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-1">Manzil</label>
                    <input type="text" name="address" id="address" value={formData.address} onChange={handleChange} required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500" />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200">Bekor qilish</button>
                    <button type="submit" disabled={!!innError} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed">Saqlash</button>
                </div>
            </form>
        </Modal>
    )
}
