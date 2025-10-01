import React, { useState, useEffect } from 'react';
import { Modal } from '../Modal';
import { Expense } from '../../types';
import { UseMockDataReturnType } from '../../hooks/useMockData';

interface ExpenseFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Omit<Expense, 'id'> | Expense) => void;
    expense: Expense | null;
    dataManager: UseMockDataReturnType;
}

const formatDate = (dateStr: string) => new Date(dateStr).toISOString().split('T')[0];

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({ isOpen, onClose, onSubmit, expense, dataManager }) => {
    const { expenseCategories } = dataManager;
    const [formData, setFormData] = useState({
        date: formatDate(new Date().toISOString()),
        categoryId: '',
        amount: 0,
        comment: ''
    });

    useEffect(() => {
        if (isOpen) {
            if (expense) {
                setFormData({
                    date: formatDate(expense.date),
                    categoryId: expense.categoryId,
                    amount: expense.amount,
                    comment: expense.comment || ''
                });
            } else {
                setFormData({
                    date: formatDate(new Date().toISOString()),
                    categoryId: expenseCategories[0]?.id || '',
                    amount: 0,
                    comment: ''
                });
            }
        }
    }, [isOpen, expense, expenseCategories]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'amount' ? parseFloat(value) || 0 : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.amount <= 0 || !formData.categoryId) {
            alert("Iltimos, kategoriya tanlang va to'g'ri summa kiriting.");
            return;
        }
        const dataToSubmit = { ...formData, date: new Date(formData.date).toISOString() };
        if (expense) {
            onSubmit({ ...dataToSubmit, id: expense.id });
        } else {
            onSubmit(dataToSubmit);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={expense ? "Harajatni tahrirlash" : "Yangi harajat"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="date" className="block text-sm font-medium">Sana</label>
                    <input type="date" id="date" name="date" value={formData.date} onChange={handleChange} required className="w-full mt-1 p-2 border rounded-md" />
                </div>
                <div>
                    <label htmlFor="categoryId" className="block text-sm font-medium">Kategoriya</label>
                    <select id="categoryId" name="categoryId" value={formData.categoryId} onChange={handleChange} required className="w-full mt-1 p-2 border rounded-md bg-white">
                        <option value="" disabled>Tanlang...</option>
                        {expenseCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="amount" className="block text-sm font-medium">Summa</label>
                    <input type="number" id="amount" name="amount" value={formData.amount} onChange={handleChange} required min="1" step="any" className="w-full mt-1 p-2 border rounded-md" />
                </div>
                <div>
                    <label htmlFor="comment" className="block text-sm font-medium">Izoh</label>
                    <textarea id="comment" name="comment" value={formData.comment} onChange={handleChange} rows={3} className="w-full mt-1 p-2 border rounded-md" />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 rounded-lg">Bekor qilish</button>
                    <button type="submit" className="px-4 py-2 bg-amber-500 text-white rounded-lg">Saqlash</button>
                </div>
            </form>
        </Modal>
    );
};