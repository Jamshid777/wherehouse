import React, { useState, useEffect } from 'react';
import { Modal } from '../Modal';
import { Employee } from '../../types';

interface EmployeeFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Omit<Employee, 'id'> | Employee) => void;
    employee: Employee | null;
}

export const EmployeeFormModal: React.FC<EmployeeFormModalProps> = ({ isOpen, onClose, onSubmit, employee }) => {
    const [formData, setFormData] = useState({ name: '', is_active: true });

    useEffect(() => {
        if (isOpen) {
            setFormData(employee ? { name: employee.name, is_active: employee.is_active } : { name: '', is_active: true });
        }
    }, [isOpen, employee]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(employee ? { ...formData, id: employee.id } : formData);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={employee ? "Xodimni tahrirlash" : "Yangi xodim qo'shish"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Xodimning F.I.Sh.</label>
                    <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                </div>
                <div className="flex items-center">
                    <input type="checkbox" name="is_active" id="is_active" checked={formData.is_active} onChange={handleChange} className="h-4 w-4 text-amber-600 border-slate-300 rounded focus:ring-amber-500" />
                    <label htmlFor="is_active" className="ml-2 block text-sm text-slate-900">Faol</label>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 rounded-lg">Bekor qilish</button>
                    <button type="submit" className="px-4 py-2 bg-amber-500 text-white rounded-lg">Saqlash</button>
                </div>
            </form>
        </Modal>
    );
};
