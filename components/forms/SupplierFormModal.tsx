
import React, { useState, useEffect } from 'react';
import { Modal } from '../Modal';
import { Supplier } from '../../types';

export interface SupplierFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Omit<Supplier, 'id'> | Supplier) => void;
    supplier: Supplier | null;
    isInnUnique: (inn: string, currentId?: string | null) => boolean;
}

export const SupplierFormModal: React.FC<SupplierFormModalProps> = ({isOpen, onClose, onSubmit, supplier, isInnUnique}) => {
    const [formData, setFormData] = useState({
        name: '', inn: '', phone: '', address: '', initial_balance: 0, credit_limit: 0
    });
    const [innError, setInnError] = useState('');

    useEffect(() => {
        if(isOpen){
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
        }
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
                    <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500" />
                </div>
                <div>
                    <label htmlFor="inn" className="block text-sm font-medium text-slate-700 mb-1">INN (STIR)</label>
                    <input type="text" name="inn" id="inn" value={formData.inn} onChange={handleChange} required className={`w-full px-3 py-2.5 border rounded-lg focus:ring-1 ${innError ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-amber-500'}`} />
                    {innError && <p className="text-xs text-red-600 mt-1">{innError}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">Telefon raqami</label>
                        <input type="text" name="phone" id="phone" value={formData.phone} onChange={handleChange} required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500" />
                    </div>
                     <div>
                        <label htmlFor="credit_limit" className="block text-sm font-medium text-slate-700 mb-1">Kredit Limiti</label>
                        <input type="number" step="any" name="credit_limit" id="credit_limit" value={formData.credit_limit} onChange={handleChange} required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500" />
                    </div>
                </div>
                 <div>
                    <label htmlFor="initial_balance" className="block text-sm font-medium text-slate-700 mb-1">Boshlang'ich qoldiq</label>
                    <input type="number" step="any" name="initial_balance" id="initial_balance" value={formData.initial_balance} onChange={handleChange} required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500" />
                    <p className="text-xs text-slate-500 mt-1">Qarzimiz bo'lsa musbat (+), bizga qarzi bo'lsa manfiy (-) kiriting.</p>
                </div>
                <div>
                    <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-1">Manzil</label>
                    <input type="text" name="address" id="address" value={formData.address} onChange={handleChange} required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500" />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200">Bekor qilish</button>
                    <button type="submit" disabled={!!innError} className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700 disabled:from-amber-300 disabled:to-amber-400 disabled:cursor-not-allowed">Saqlash</button>
                </div>
            </form>
        </Modal>
    )
}
