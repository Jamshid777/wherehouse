import { useState } from 'react';
import { Expense, ExpenseCategory } from '../../types';

export const useExpenseData = (initialCategories: ExpenseCategory[], initialExpenses: Expense[]) => {
    const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>(initialCategories);
    const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);

    const addExpenseCategory = (category: Omit<ExpenseCategory, 'id'>): ExpenseCategory => {
        const newCategory = { ...category, id: `ec${Date.now()}` };
        setExpenseCategories(prev => [newCategory, ...prev]);
        return newCategory;
    };
    const updateExpenseCategory = (updatedCategory: ExpenseCategory) => setExpenseCategories(prev => prev.map(c => c.id === updatedCategory.id ? updatedCategory : c));
    const deleteExpenseCategory = (categoryId: string) => {
        if (expenses.some(e => e.categoryId === categoryId)) {
            alert("Bu kategoriya ishlatilganligi sababli o'chirib bo'lmaydi.");
            return;
        }
        setExpenseCategories(prev => prev.filter(c => c.id !== categoryId));
    };

    const addExpense = (expense: Omit<Expense, 'id'>): Expense => {
        const newExpense = { ...expense, id: `exp${Date.now()}` };
        setExpenses(prev => [newExpense, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        return newExpense;
    };
    const updateExpense = (updatedExpense: Expense) => setExpenses(prev => prev.map(e => e.id === updatedExpense.id ? updatedExpense : e));
    const deleteExpense = (expenseId: string) => setExpenses(prev => prev.filter(e => e.id !== expenseId));

    return {
        expenseCategories, setExpenseCategories, addExpenseCategory, updateExpenseCategory, deleteExpenseCategory,
        expenses, setExpenses, addExpense, updateExpense, deleteExpense
    };
};
