

import React, {useState, useEffect} from 'react';
import { Modal } from '../Modal';
import { Warehouse } from '../../types';

interface WarehouseFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Omit<Warehouse, 'id'> | Warehouse) => void;
    warehouse: Warehouse | null;
}

export const WarehouseFormModal: React.FC<WarehouseFormModalProps> = ({isOpen, onClose, onSubmit, warehouse}) => {
    const [formData, setFormData] = useState({
        name: '',
        is_active: true,
    });

    useEffect(() => {
        if(isOpen){
            if(warehouse){
                setFormData({
                    name: warehouse.name,
                    is_active: warehouse.is_active,
                });
            } else {
                setFormData({
                    name: '', is_active: true,
                });
            }
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
        <Modal isOpen={isOpen} onClose={onClose} title={warehouse ? "Omborni tahrirlash" : "Yangi ombor qo'shish"} closeOnOverlayClick={false}>
            <form onSubmit={handleFormSubmit} className="space-y-4">
                 <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Ombor nomi</label>
                    <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500" />
                </div>
                <div className="flex items-center">
                    <input type="checkbox" name="is_active" id="is_active" checked={formData.is_active} onChange={handleChange} className="h-4 w-4 text-amber-600 border-slate-300 rounded focus:ring-amber-500" />
                    <label htmlFor="is_active" className="ml-2 block text-sm text-slate-900">Faol</label>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200">Bekor qilish</button>
                    <button type="submit" className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700">Saqlash</button>
                </div>
            </form>
        </Modal>
    )
}