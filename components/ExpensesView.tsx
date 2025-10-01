import React, { useState, useMemo, useRef, useEffect } from 'react';
import { UseMockDataReturnType } from '../hooks/useMockData';
import { Expense, ExpenseCategory, Employee } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { EditIcon } from './icons/EditIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ConfirmationModal } from './ConfirmationModal';
import { ExpenseFormModal } from './forms/ExpenseFormModal';
import { ExpenseCategoryFormModal } from './forms/ExpenseCategoryFormModal';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { EmployeeFormModal } from './forms/EmployeeFormModal';

const formatCurrency = (amount: number) => new Intl.NumberFormat('uz-UZ').format(amount);
const formatDate = (date: Date) => date.toISOString().split('T')[0];

// ===================================
// Expenses List View
// ===================================
const ExpenseListView: React.FC<{ dataManager: UseMockDataReturnType }> = ({ dataManager }) => {
    const { expenses, expenseCategories, addExpense, updateExpense, deleteExpense, employees: allEmployees } = dataManager;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
    const [isCommentFilterOpen, setIsCommentFilterOpen] = useState(false);
    const commentFilterRef = useRef<HTMLDivElement>(null);
    const [isEmployeeFilterOpen, setIsEmployeeFilterOpen] = useState(false);
    const employeeFilterRef = useRef<HTMLDivElement>(null);


    const [filters, setFilters] = useState({
        dateFrom: formatDate(new Date(new Date().setMonth(new Date().getMonth() - 1))),
        dateTo: formatDate(new Date()),
        categoryId: 'all',
        selectedComments: [] as string[],
        selectedEmployees: [] as string[],
    });

    const uniqueComments = useMemo(() => {
        const comments = new Set<string>();
        expenses.forEach(exp => {
            if (exp.comment) {
                comments.add(exp.comment);
            }
        });
        return Array.from(comments).sort();
    }, [expenses]);
    
    const activeEmployees = useMemo(() => {
        return allEmployees.filter(e => e.is_active).sort((a, b) => a.name.localeCompare(b.name));
    }, [allEmployees]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (commentFilterRef.current && !commentFilterRef.current.contains(event.target as Node)) {
                setIsCommentFilterOpen(false);
            }
            if (employeeFilterRef.current && !employeeFilterRef.current.contains(event.target as Node)) {
                setIsEmployeeFilterOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleCommentSelectionChange = (comment: string) => {
        setFilters(prev => {
            const newSelected = new Set(prev.selectedComments);
            if (newSelected.has(comment)) {
                newSelected.delete(comment);
            } else {
                newSelected.add(comment);
            }
            return { ...prev, selectedComments: Array.from(newSelected) };
        });
    };

    const handleEmployeeSelectionChange = (employeeId: string) => {
        setFilters(prev => {
            const newSelected = new Set(prev.selectedEmployees);
            if (newSelected.has(employeeId)) {
                newSelected.delete(employeeId);
            } else {
                newSelected.add(employeeId);
            }
            return { ...prev, selectedEmployees: Array.from(newSelected) };
        });
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleDatePreset = (preset: 'today' | 'week' | 'month' | '3month') => {
        const to = new Date();
        let from = new Date();
        if (preset === 'today') {} 
        else if (preset === 'week') { from.setDate(to.getDate() - 7); } 
        else if (preset === 'month') { from.setMonth(to.getMonth() - 1); } 
        else if (preset === '3month') { from.setMonth(to.getMonth() - 3); }
        setFilters(prev => ({ ...prev, dateFrom: formatDate(from), dateTo: formatDate(to) }));
    };

    const filteredExpenses = useMemo(() => {
        const dateFrom = new Date(filters.dateFrom);
        dateFrom.setHours(0, 0, 0, 0);
        const dateTo = new Date(filters.dateTo);
        dateTo.setHours(23, 59, 59, 999);

        return expenses.filter(exp => {
            const expDate = new Date(exp.date);
            if (expDate < dateFrom || expDate > dateTo) {
                return false;
            }
            if (filters.categoryId !== 'all' && exp.categoryId !== filters.categoryId) {
                return false;
            }
            if (filters.selectedComments.length > 0 && (!exp.comment || !filters.selectedComments.includes(exp.comment))) {
                return false;
            }
            if (filters.selectedEmployees.length > 0 && (!exp.employeeId || !filters.selectedEmployees.includes(exp.employeeId))) {
                return false;
            }
            return true;
        });
    }, [expenses, filters]);
    
    const totalAmount = useMemo(() => {
        return filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    }, [filteredExpenses]);


    const handleOpenModal = (expense: Expense | null = null) => {
        setEditingExpense(expense);
        setIsModalOpen(true);
    };

    const handleSubmit = (formData: Omit<Expense, 'id'> | Expense) => {
        if ('id' in formData) {
            updateExpense(formData);
        } else {
            addExpense(formData);
        }
        setIsModalOpen(false);
    };

    const getCategoryName = (id: string) => expenseCategories.find(c => c.id === id)?.name || 'Noma\'lum';

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Harajatlar Ro'yxati</h3>
                <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2.5 rounded-lg shadow">
                    <PlusIcon className="h-5 w-5" /><span>Yangi Harajat</span>
                </button>
            </div>

            <div className="flex flex-wrap items-end gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50 mb-6">
                <div>
                    <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 mb-1">Sana (dan)</label>
                    <input type="date" name="dateFrom" value={filters.dateFrom} onChange={handleFilterChange} className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                    <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 mb-1">Sana (gacha)</label>
                    <input type="date" name="dateTo" value={filters.dateTo} onChange={handleFilterChange} className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div className="flex items-center gap-2 self-end">
                    <button type="button" onClick={() => handleDatePreset('today')} className="px-3 py-2 text-sm bg-gray-200 rounded-md hover:bg-gray-300 transition-colors">Bugun</button>
                    <button type="button" onClick={() => handleDatePreset('week')} className="px-3 py-2 text-sm bg-gray-200 rounded-md hover:bg-gray-300 transition-colors">Hafta</button>
                    <button type="button" onClick={() => handleDatePreset('month')} className="px-3 py-2 text-sm bg-gray-200 rounded-md hover:bg-gray-300 transition-colors">Oy</button>
                </div>
                 <div>
                    <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">Kategoriya</label>
                    <select name="categoryId" id="categoryId" value={filters.categoryId} onChange={handleFilterChange} className="w-full md:w-48 px-3 py-2.5 border border-gray-300 rounded-lg text-sm">
                        <option value="all">Barcha kategoriyalar</option>
                        {expenseCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                </div>
                 <div className="relative" ref={commentFilterRef}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Izoh</label>
                    <button
                        type="button"
                        onClick={() => setIsCommentFilterOpen(!isCommentFilterOpen)}
                        className="w-full md:w-48 flex justify-between items-center px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm"
                    >
                        <span className="text-gray-700 truncate">
                            {filters.selectedComments.length > 0 ? `${filters.selectedComments.length} ta tanlandi` : 'Barchasi'}
                        </span>
                        <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                    </button>
                    {isCommentFilterOpen && (
                        <div className="absolute z-10 w-64 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                            <div className="p-2 border-b">
                                <button
                                    type="button"
                                    onClick={() => setFilters(prev => ({ ...prev, selectedComments: [] }))}
                                    className="w-full text-sm text-blue-600 hover:underline"
                                >
                                    Tozalash
                                </button>
                            </div>
                            <ul className="max-h-60 overflow-y-auto p-2 space-y-1">
                                {uniqueComments.map(comment => (
                                    <li key={comment}>
                                        <label className="flex items-center space-x-2 p-1 rounded hover:bg-gray-100 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={filters.selectedComments.includes(comment)}
                                                onChange={() => handleCommentSelectionChange(comment)}
                                                className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                                            />
                                            <span className="text-sm text-gray-700 truncate">{comment}</span>
                                        </label>
                                    </li>
                                ))}
                                {uniqueComments.length === 0 && (
                                    <li className="px-2 py-1 text-sm text-gray-500">Izohlar topilmadi.</li>
                                )}
                            </ul>
                        </div>
                    )}
                </div>
                <div className="relative" ref={employeeFilterRef}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Xodim</label>
                    <button
                        type="button"
                        onClick={() => setIsEmployeeFilterOpen(!isEmployeeFilterOpen)}
                        className="w-full md:w-48 flex justify-between items-center px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm"
                    >
                        <span className="text-gray-700 truncate">
                            {filters.selectedEmployees.length > 0 ? `${filters.selectedEmployees.length} ta tanlandi` : 'Barchasi'}
                        </span>
                        <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                    </button>
                    {isEmployeeFilterOpen && (
                        <div className="absolute z-10 w-64 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                            <div className="p-2 border-b">
                                <button
                                    type="button"
                                    onClick={() => setFilters(prev => ({ ...prev, selectedEmployees: [] }))}
                                    className="w-full text-sm text-blue-600 hover:underline"
                                >
                                    Tozalash
                                </button>
                            </div>
                            <ul className="max-h-60 overflow-y-auto p-2 space-y-1">
                                {activeEmployees.map(employee => (
                                    <li key={employee.id}>
                                        <label className="flex items-center space-x-2 p-1 rounded hover:bg-gray-100 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={filters.selectedEmployees.includes(employee.id)}
                                                onChange={() => handleEmployeeSelectionChange(employee.id)}
                                                className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                                            />
                                            <span className="text-sm text-gray-700 truncate">{employee.name}</span>
                                        </label>
                                    </li>
                                ))}
                                {activeEmployees.length === 0 && (
                                    <li className="px-2 py-1 text-sm text-gray-500">Faol xodimlar topilmadi.</li>
                                )}
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="p-3 text-left font-medium">Sana</th><th className="p-3 text-left font-medium">Kategoriya</th><th className="p-3 text-right font-medium">Summa</th><th className="p-3 text-left font-medium">Izoh</th><th className="p-3 text-center font-medium">Amallar</th></tr></thead>
                    <tbody className="divide-y divide-gray-200">
                        {filteredExpenses.map(exp => {
                            const employee = exp.employeeId ? allEmployees.find(e => e.id === exp.employeeId) : null;
                            return (
                            <tr key={exp.id} className="hover:bg-amber-50">
                                <td className="p-3">{new Date(exp.date).toLocaleDateString()}</td>
                                <td className="p-3 font-medium text-gray-800">{getCategoryName(exp.categoryId)}</td>
                                <td className="p-3 text-right font-mono">{formatCurrency(exp.amount)}</td>
                                <td className="p-3">
                                    {employee && <div className="font-semibold text-gray-700">Xodim: {employee.name}</div>}
                                    <div className="text-gray-500 italic">{exp.comment}</div>
                                </td>
                                <td className="p-3 text-center"><div className="flex justify-center gap-2">
                                    <button onClick={() => handleOpenModal(exp)} className="p-2 text-amber-600 hover:bg-amber-100 rounded-full"><EditIcon className="h-5 w-5" /></button>
                                    <button onClick={() => setExpenseToDelete(exp.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-full"><TrashIcon className="h-5 w-5" /></button>
                                </div></td>
                            </tr>
                        )})}
                        {filteredExpenses.length === 0 && (
                            <tr><td colSpan={5} className="text-center py-10 text-gray-500">Harajatlar topilmadi.</td></tr>
                        )}
                    </tbody>
                    <tfoot className="bg-gray-100 font-bold">
                        <tr>
                            <td colSpan={2} className="p-3 text-right">Jami:</td>
                            <td className="p-3 text-right font-mono text-base">{formatCurrency(totalAmount)}</td>
                            <td colSpan={2}></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            <ExpenseFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleSubmit} expense={editingExpense} dataManager={dataManager} />
            <ConfirmationModal isOpen={!!expenseToDelete} onClose={() => setExpenseToDelete(null)} onConfirm={() => { if(expenseToDelete) deleteExpense(expenseToDelete); }} title="Harajatni o'chirish" message="Haqiqatan ham bu harajatni o'chirmoqchimisiz?" />
        </>
    );
};

// ===================================
// Expense Categories View
// ===================================
const ExpenseCategoryListView: React.FC<{ dataManager: UseMockDataReturnType }> = ({ dataManager }) => {
    const { expenseCategories, addExpenseCategory, updateExpenseCategory, deleteExpenseCategory } = dataManager;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
    const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

    const handleOpenModal = (category: ExpenseCategory | null = null) => {
        setEditingCategory(category);
        setIsModalOpen(true);
    };
    
    const handleSubmit = (formData: Omit<ExpenseCategory, 'id'> | ExpenseCategory) => {
        if ('id' in formData) {
            updateExpenseCategory(formData);
        } else {
            addExpenseCategory(formData);
        }
        setIsModalOpen(false);
    };

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Harajat Kategoriyalari</h3>
                <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2.5 rounded-lg shadow">
                    <PlusIcon className="h-5 w-5" /><span>Yangi Kategoriya</span>
                </button>
            </div>
            <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="p-3 text-left font-medium">Nomi</th><th className="p-3 text-center font-medium">Amallar</th></tr></thead>
                    <tbody className="divide-y divide-gray-200">
                        {expenseCategories.map(cat => (
                            <tr key={cat.id} className="hover:bg-amber-50">
                                <td className="p-3 font-medium text-gray-800">{cat.name}</td>
                                <td className="p-3 text-center"><div className="flex justify-center gap-2">
                                    <button onClick={() => handleOpenModal(cat)} className="p-2 text-amber-600 hover:bg-amber-100 rounded-full"><EditIcon className="h-5 w-5" /></button>
                                    <button onClick={() => setCategoryToDelete(cat.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-full"><TrashIcon className="h-5 w-5" /></button>
                                </div></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <ExpenseCategoryFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleSubmit} category={editingCategory} />
            <ConfirmationModal isOpen={!!categoryToDelete} onClose={() => setCategoryToDelete(null)} onConfirm={() => { if(categoryToDelete) deleteExpenseCategory(categoryToDelete); }} title="Kategoriyani o'chirish" message="Haqiqatan ham bu kategoriyani o'chirmoqchimisiz? Agar bu kategoriya biror harajatda ishlatilgan bo'lsa, o'chirish mumkin bo'lmaydi." />
        </>
    );
};

// ===================================
// Employee List View
// ===================================
const EmployeeListView: React.FC<{ dataManager: UseMockDataReturnType }> = ({ dataManager }) => {
    const { employees, addEmployee, updateEmployee, deleteEmployee } = dataManager;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [employeeToDelete, setEmployeeToDelete] = useState<string | null>(null);

    const handleOpenModal = (employee: Employee | null = null) => {
        setEditingEmployee(employee);
        setIsModalOpen(true);
    };
    
    const handleSubmit = (formData: Omit<Employee, 'id'> | Employee) => {
        if ('id' in formData) {
            updateEmployee(formData);
        } else {
            addEmployee(formData);
        }
        setIsModalOpen(false);
    };

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Xodimlar Ro'yxati</h3>
                <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2.5 rounded-lg shadow">
                    <PlusIcon className="h-5 w-5" /><span>Yangi Xodim</span>
                </button>
            </div>
            <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                        <tr>
                            <th className="p-3 text-left font-medium">F.I.Sh.</th>
                            <th className="p-3 text-left font-medium">Holati</th>
                            <th className="p-3 text-center font-medium">Amallar</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {employees.map(emp => (
                            <tr key={emp.id} className="hover:bg-amber-50">
                                <td className="p-3 font-medium text-gray-800">{emp.name}</td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${emp.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {emp.is_active ? 'Faol' : 'Faol emas'}
                                    </span>
                                </td>
                                <td className="p-3 text-center">
                                    <div className="flex justify-center gap-2">
                                        <button onClick={() => handleOpenModal(emp)} className="p-2 text-amber-600 hover:bg-amber-100 rounded-full"><EditIcon className="h-5 w-5" /></button>
                                        <button onClick={() => setEmployeeToDelete(emp.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-full"><TrashIcon className="h-5 w-5" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <EmployeeFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleSubmit} employee={editingEmployee} />
            <ConfirmationModal isOpen={!!employeeToDelete} onClose={() => setEmployeeToDelete(null)} onConfirm={() => { if(employeeToDelete) deleteEmployee(employeeToDelete); }} title="Xodimni o'chirish" message="Haqiqatan ham bu xodimni o'chirmoqchimisiz?" />
        </>
    );
}


// ===================================
// Main View with Tabs
// ===================================
type ActiveTab = 'expenses' | 'categories' | 'employees';

export const ExpensesView: React.FC<{ dataManager: UseMockDataReturnType }> = ({ dataManager }) => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('expenses');
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="bg-gray-100 p-1 rounded-lg flex space-x-1 max-w-lg mb-6">
                <button onClick={() => setActiveTab('expenses')} className={`w-full px-4 py-2 rounded-md transition-colors ${activeTab === 'expenses' ? 'bg-white shadow-sm font-semibold text-amber-600' : 'text-gray-600 hover:bg-white/60'}`}>Harajatlar</button>
                <button onClick={() => setActiveTab('categories')} className={`w-full px-4 py-2 rounded-md transition-colors ${activeTab === 'categories' ? 'bg-white shadow-sm font-semibold text-amber-600' : 'text-gray-600 hover:bg-white/60'}`}>Kategoriyalar</button>
                <button onClick={() => setActiveTab('employees')} className={`w-full px-4 py-2 rounded-md transition-colors ${activeTab === 'employees' ? 'bg-white shadow-sm font-semibold text-amber-600' : 'text-gray-600 hover:bg-white/60'}`}>Xodimlar</button>
            </div>
            {activeTab === 'expenses' ? <ExpenseListView dataManager={dataManager} /> : activeTab === 'categories' ? <ExpenseCategoryListView dataManager={dataManager} /> : <EmployeeListView dataManager={dataManager} />}
        </div>
    );
};