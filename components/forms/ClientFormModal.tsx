import React, { useState, useEffect } from 'react';
import { Modal } from '../Modal';
import { Client } from '../../types';

export interface ClientFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Omit<Client, 'id'> | Client) => void;
    client: Client | null;
}

export const ClientFormModal: React.FC<ClientFormModalProps> = ({isOpen, onClose, onSubmit, client}) => {
    const [formData, setFormData] = useState({
        name: '', phone: '', address: '', is_active: true, initial_balance: 0
    });
    
    useEffect(() => {
        if(isOpen){
            if(client){
                setFormData({
                    name: client.name,
                    phone: client.phone || '',
                    address: client.address || '',
                    is_active: client.is_active,
                    initial_balance: client.initial_balance || 0,
                });
            } else {
                setFormData({ name: '', phone: '', address: '', is_active: true, initial_balance: 0 });
            }
        }
    }, [client, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev, 
            [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) || 0 : value)
        }));
    }
    
    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const dataToSubmit: Partial<Omit<Client, 'id'>> & { name: string; initial_balance: number, is_active: boolean } = {
            name: formData.name,
            initial_balance: formData.initial_balance,
            is_active: formData.is_active,
        };
        
        if (formData.phone) dataToSubmit.phone = formData.phone;
        if (formData.address) dataToSubmit.address = formData.address;

        if(client){
            onSubmit({...dataToSubmit, id: client.id});
        } else {
            onSubmit(dataToSubmit as Omit<Client, 'id'>);
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={client ? "Mijoz ma'lumotlarini tahrirlash" : "Yangi mijoz qo'shish"} closeOnOverlayClick={false}>
            <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Mijoz nomi <span className="text-red-500">*</span></label>
                    <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500" />
                </div>
                 <div>
                    <label htmlFor="initial_balance" className="block text-sm font-medium text-slate-700 mb-1">Boshlang'ich qoldiq <span className="text-red-500">*</span></label>
                    <input type="number" step="any" name="initial_balance" id="initial_balance" value={formData.initial_balance} onChange={handleChange} required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500" />
                    <p className="text-xs text-slate-500 mt-1">Mijozning bizdan qarzi bo'lsa musbat (+), bizning qarzimiz bo'lsa manfiy (-) kiriting.</p>
                </div>
                <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">Telefon raqami</label>
                    <input type="text" name="phone" id="phone" value={formData.phone} onChange={handleChange} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500" />
                </div>
                <div>
                    <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-1">Manzil</label>
                    <input type="text" name="address" id="address" value={formData.address} onChange={handleChange} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500" />
                </div>
                 <div className="flex items-center">
                    <input type="checkbox" name="is_active" id="is_active" checked={formData.is_active} onChange={handleChange} className="h-4 w-4 text-amber-600 border-slate-300 rounded focus:ring-amber-500" />
                    <label htmlFor="is_active" className="ml-2 block text-sm text-slate-900">Faol</label>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200">Bekor qilish</button>
                    <button type="submit" className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700">Saqlash</button>
                </div>
            </form>
        </Modal>
    )
}
