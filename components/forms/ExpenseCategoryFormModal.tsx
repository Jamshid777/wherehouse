import React, { useState, useEffect } from 'react';
import { Modal } from '../Modal';
import { ExpenseCategory } from '../../types';

interface ExpenseCategoryFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Omit<ExpenseCategory, 'id'> | ExpenseCategory) => void;
    category: ExpenseCategory | null;
}

export const ExpenseCategoryFormModal: React.FC<ExpenseCategoryFormModalProps> = ({ isOpen, onClose, onSubmit, category }) => {
    const [name, setName] = useState('');

    useEffect(() => {
        if (isOpen) {
            setName(category ? category.name : '');
        }
    }, [isOpen, category]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (category) {
            onSubmit({ id: category.id, name });
        } else {
            onSubmit({ name });
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={category ? "Kategoriyani tahrirlash" : "Yangi harajat kategoriyasi"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Kategoriya nomi</label>
                    <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 rounded-lg">Bekor qilish</button>
                    <button type="submit" className="px-4 py-2 bg-amber-500 text-white rounded-lg">Saqlash</button>
                </div>
            </form>
        </Modal>
    );
};