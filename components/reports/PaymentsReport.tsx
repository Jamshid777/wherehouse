

import React, { useState, useMemo } from 'react';
import { Payment, PaymentMethod } from '../../types';
import { UseMockDataReturnType } from '../../hooks/useMockData';
import { SearchIcon } from '../icons/SearchIcon';
import { PlusIcon } from '../icons/PlusIcon';
import { PaymentFormModal } from '../forms/PaymentFormModal';


const formatCurrency = (amount: number) => new Intl.NumberFormat('uz-UZ').format(amount);
const formatDate = (date: Date) => date.toISOString().split('T')[0];

interface PaymentsReportProps {
  dataManager: UseMockDataReturnType;
}

export const PaymentsReport: React.FC<PaymentsReportProps> = ({ dataManager }) => {
    const { payments, suppliers, goodsReceipts, addPayment } = dataManager;
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const [filters, setFilters] = useState({
        dateFrom: formatDate(new Date(new Date().setMonth(new Date().getMonth() - 1))),
        dateTo: formatDate(new Date()),
        searchTerm: '',
        supplierId: 'all',
        paymentMethod: 'all',
    });

    const handleOpenModal = () => setIsModalOpen(true);
    const handleCloseModal = () => setIsModalOpen(false);

    const handleSubmit = (formData: Omit<Payment, 'id' | 'doc_number' | 'links'>) => {
        addPayment(formData);
        handleCloseModal();
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleDatePreset = (preset: 'today' | 'week' | 'month') => {
        const to = new Date();
        let from = new Date();
        if(preset === 'week') from.setDate(to.getDate() - 7);
        if(preset === 'month') from.setMonth(to.getMonth() - 1);
        
        setFilters(prev => ({...prev, dateFrom: formatDate(from), dateTo: formatDate(to) }));
    };

    const grnDocNumbers = useMemo(() => {
        return new Map(goodsReceipts.map(grn => [grn.id, grn.doc_number]));
    }, [goodsReceipts]);

    const filteredPayments = useMemo(() => {
        const dateFrom = new Date(filters.dateFrom);
        dateFrom.setHours(0, 0, 0, 0);
        const dateTo = new Date(filters.dateTo);
        dateTo.setHours(23, 59, 59, 999);
        
        const lowerCaseSearch = filters.searchTerm.toLowerCase();
        
        return payments
            .filter(p => {
                const noteDate = new Date(p.date);
                if (noteDate < dateFrom || noteDate > dateTo) return false;
                if (filters.supplierId !== 'all' && p.supplier_id !== filters.supplierId) return false;
                if (filters.paymentMethod !== 'all' && p.payment_method !== filters.paymentMethod) return false;
                
                if (lowerCaseSearch) {
                    const supplierName = suppliers.find(s => s.id === p.supplier_id)?.name || '';
                    const linkedDocsString = p.links.map(link => grnDocNumbers.get(link.grnId) || '').join(' ');

                    const searchMatch = (
                        p.comment.toLowerCase().includes(lowerCaseSearch) ||
                        supplierName.toLowerCase().includes(lowerCaseSearch) ||
                        p.doc_number.toLowerCase().includes(lowerCaseSearch) ||
                        linkedDocsString.toLowerCase().includes(lowerCaseSearch)
                    );
                    if (!searchMatch) return false;
                }

                return true;
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [payments, suppliers, filters, grnDocNumbers]);

    const totalAmount = useMemo(() => {
        return filteredPayments.reduce((sum, p) => sum + p.amount, 0);
    }, [filteredPayments]);
    
    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-slate-800">To'lovlar Hisoboti</h2>
                <button
                    onClick={handleOpenModal}
                    className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2.5 rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all shadow"
                >
                    <PlusIcon className="h-5 w-5" />
                    <span>Yangi To'lov</span>
                </button>
            </div>

            <div className="flex flex-wrap items-end gap-4 p-4 border rounded-lg bg-slate-50 mb-6">
                <div>
                    <label htmlFor="dateFrom" className="block text-sm font-medium text-slate-700 mb-1">Dan</label>
                    <input type="date" name="dateFrom" value={filters.dateFrom} onChange={handleFilterChange} className="px-3 py-2.5 border border-slate-300 rounded-lg text-sm" />
                </div>
                <div>
                    <label htmlFor="dateTo" className="block text-sm font-medium text-slate-700 mb-1">Gacha</label>
                    <input type="date" name="dateTo" value={filters.dateTo} onChange={handleFilterChange} className="px-3 py-2.5 border border-slate-300 rounded-lg text-sm" />
                </div>
                <div className="flex items-center gap-2 self-end">
                    <button onClick={() => handleDatePreset('today')} className="px-3 py-2 text-sm bg-slate-200 rounded-md hover:bg-slate-300 transition-colors">Bugun</button>
                    <button onClick={() => handleDatePreset('week')} className="px-3 py-2 text-sm bg-slate-200 rounded-md hover:bg-slate-300 transition-colors">Hafta</button>
                    <button onClick={() => handleDatePreset('month')} className="px-3 py-2 text-sm bg-slate-200 rounded-md hover:bg-slate-300 transition-colors">Oy</button>
                </div>
                <div>
                    <label htmlFor="supplierId" className="block text-sm font-medium text-slate-700 mb-1">Ta'minotchi</label>
                    <select name="supplierId" value={filters.supplierId} onChange={handleFilterChange} className="w-full md:w-48 px-3 py-2.5 border border-slate-300 rounded-lg text-sm">
                        <option value="all">Barchasi</option>
                        {suppliers.filter(s => s.id !== 'SYSTEM').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="paymentMethod" className="block text-sm font-medium text-slate-700 mb-1">To'lov usuli</label>
                    <select name="paymentMethod" value={filters.paymentMethod} onChange={handleFilterChange} className="w-full md:w-48 px-3 py-2.5 border border-slate-300 rounded-lg text-sm">
                        <option value="all">Barchasi</option>
                        {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>
                <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                        type="text"
                        name="searchTerm"
                        placeholder="Qidirish..."
                        value={filters.searchTerm}
                        onChange={handleFilterChange}
                        className="w-full md:w-56 pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition text-sm"
                    />
                </div>
            </div>

            <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm text-left border-collapse">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 tracking-wider">
                        <tr>
                            <th scope="col" className="px-6 py-3 border-r">To‘lov sanasi</th>
                            <th scope="col" className="px-6 py-3 border-r">Ta'minotchi</th>
                            <th scope="col" className="px-6 py-3 text-right border-r">To‘lov summasi</th>
                            <th scope="col" className="px-6 py-3 border-r">To‘lov usuli</th>
                            <th scope="col" className="px-6 py-3 border-r">Bog'liq hujjatlar</th>
                            <th scope="col" className="px-6 py-3">Izoh</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {filteredPayments.map(payment => {
                            const supplier = suppliers.find(s => s.id === payment.supplier_id);
                            return (
                                <tr key={payment.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 border-r">{new Date(payment.date).toLocaleDateString('uz-UZ')}</td>
                                    <td className="px-6 py-4 font-medium text-slate-800 border-r">{supplier?.name || 'Noma\'lum'}</td>
                                    <td className="px-6 py-4 text-right font-mono font-semibold text-slate-800 border-r">{formatCurrency(payment.amount)}</td>
                                    <td className="px-6 py-4 border-r">{payment.payment_method}</td>
                                    <td className="px-6 py-4 border-r">
                                        {payment.links.map(link => (
                                            <span key={link.grnId} className="inline-block bg-slate-200 text-slate-700 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full">
                                                {grnDocNumbers.get(link.grnId) || 'N/A'}
                                            </span>
                                        ))}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 italic">{payment.comment}</td>
                                </tr>
                            );
                        })}
                        {filteredPayments.length === 0 && (
                            <tr><td colSpan={6} className="text-center py-10 text-slate-500">Hisobot uchun ma'lumot topilmadi.</td></tr>
                        )}
                    </tbody>
                    <tfoot className="bg-slate-100 font-bold">
                        <tr>
                            <td colSpan={2} className="px-6 py-3 text-right border-r">Jami:</td>
                            <td className="px-6 py-3 text-right font-mono text-lg text-slate-900 border-r">{formatCurrency(totalAmount)}</td>
                            <td colSpan={3}></td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <PaymentFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSubmit}
                dataManager={dataManager}
            />
        </div>
    );
};