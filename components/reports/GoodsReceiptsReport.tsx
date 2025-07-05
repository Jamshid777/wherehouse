
import React, { useState, useMemo, useEffect } from 'react';
import { UseMockDataReturnType } from '../../hooks/useMockData';
import { GoodsReceiptNote, GoodsReceiptItem } from '../../types';

interface GoodsReceiptsReportProps {
    dataManager: UseMockDataReturnType;
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('uz-UZ').format(amount);
const formatDate = (date: Date) => date.toISOString().split('T')[0];

export const GoodsReceiptsReport: React.FC<GoodsReceiptsReportProps> = ({ dataManager }) => {
    const { goodsReceipts, suppliers, warehouses } = dataManager;
    const [reportData, setReportData] = useState<GoodsReceiptNote[] | null>(null);
    const [filters, setFilters] = useState({
        dateFrom: formatDate(new Date(new Date().setDate(new Date().getDate() - 7))),
        dateTo: formatDate(new Date()),
        supplierId: 'all',
        warehouseId: 'all',
    });
    const [isLoading, setIsLoading] = useState(true);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleGenerateReport = () => {
        setIsLoading(true);
        const dateFrom = new Date(filters.dateFrom);
        dateFrom.setHours(0,0,0,0);

        const dateTo = new Date(filters.dateTo);
        dateTo.setHours(23,59,59,999);

        const filteredData = goodsReceipts.filter(note => {
            const noteDate = new Date(note.date);
            const isSystemGenerated = note.type === 'inventory_surplus' || note.supplier_id === 'SYSTEM';
            return (
                !isSystemGenerated &&
                noteDate >= dateFrom &&
                noteDate <= dateTo &&
                (filters.supplierId === 'all' || note.supplier_id === filters.supplierId) &&
                (filters.warehouseId === 'all' || note.warehouse_id === filters.warehouseId)
            );
        });
        setReportData(filteredData);
        setIsLoading(false);
    };
    
    useEffect(() => {
        handleGenerateReport();
    }, [filters, dataManager]);

    const getNoteTotal = (items: GoodsReceiptItem[]) => items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const totalAmount = useMemo(() => {
        if (!reportData) return 0;
        return reportData.reduce((sum, note) => sum + getNoteTotal(note.items), 0);
    }, [reportData]);

    const dateRangeText = useMemo(() => {
        const from = new Date(filters.dateFrom).toLocaleDateString('uz-UZ');
        const to = new Date(filters.dateTo).toLocaleDateString('uz-UZ');
        return `${from} - ${to} oralig'idagi kirimlar`;
    }, [filters.dateFrom, filters.dateTo])

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-2xl font-bold text-slate-800 mb-1">Kirimlar Hisoboti (Yetkazib beruvchilar bo'yicha)</h2>
            <p className="text-sm text-slate-500 mb-4">{dateRangeText}</p>

            <div className="flex flex-wrap items-end gap-4 p-4 border rounded-lg bg-slate-50 mb-6">
                <div>
                    <label htmlFor="dateFrom" className="block text-sm font-medium text-slate-700 mb-1">Dan</label>
                    <input type="date" name="dateFrom" value={filters.dateFrom} onChange={handleFilterChange} className="px-3 py-2.5 border border-slate-300 rounded-lg text-sm" />
                </div>
                <div>
                    <label htmlFor="dateTo" className="block text-sm font-medium text-slate-700 mb-1">Gacha</label>
                    <input type="date" name="dateTo" value={filters.dateTo} onChange={handleFilterChange} className="px-3 py-2.5 border border-slate-300 rounded-lg text-sm" />
                </div>
                <div>
                    <label htmlFor="supplierId" className="block text-sm font-medium text-slate-700 mb-1">Yetkazib beruvchi</label>
                    <select name="supplierId" value={filters.supplierId} onChange={handleFilterChange} className="w-full md:w-48 px-3 py-2.5 border border-slate-300 rounded-lg text-sm">
                        <option value="all">Barchasi</option>
                        {suppliers.filter(s=> s.id !== 'SYSTEM').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="warehouseId" className="block text-sm font-medium text-slate-700 mb-1">Ombor</label>
                    <select name="warehouseId" value={filters.warehouseId} onChange={handleFilterChange} className="w-full md:w-48 px-3 py-2.5 border border-slate-300 rounded-lg text-sm">
                        <option value="all">Barchasi</option>
                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                </div>
            </div>

            {isLoading && <div className="text-center py-8">Yuklanmoqda...</div>}

            {!isLoading && reportData && (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 tracking-wider">
                            <tr>
                                <th className="px-6 py-3 text-left border-r border-slate-200">Raqam</th>
                                <th className="px-6 py-3 text-left border-r border-slate-200">Sana</th>
                                <th className="px-6 py-3 text-left border-r border-slate-200">Yetkazib beruvchi</th>
                                <th className="px-6 py-3 text-left border-r border-slate-200">Ombor</th>
                                <th className="px-6 py-3 text-right">Summa</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {reportData.map(note => (
                                <tr key={note.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-900 border-r border-slate-200">{note.doc_number}</td>
                                    <td className="px-6 py-4 text-slate-600 border-r border-slate-200">{new Date(note.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-slate-600 border-r border-slate-200">{suppliers.find(s => s.id === note.supplier_id)?.name || 'Noma\'lum'}</td>
                                    <td className="px-6 py-4 text-slate-600 border-r border-slate-200">{warehouses.find(w => w.id === note.warehouse_id)?.name || 'Noma\'lum'}</td>
                                    <td className="px-6 py-4 font-mono text-right text-slate-800">{formatCurrency(getNoteTotal(note.items))}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-slate-50 font-bold">
                            <tr>
                                <td colSpan={4} className="px-6 py-3 text-right text-slate-600 border-r border-slate-200">Jami:</td>
                                <td className="px-6 py-3 text-right font-mono text-slate-900">{formatCurrency(totalAmount)}</td>
                            </tr>
                        </tfoot>
                     </table>
                     {reportData.length === 0 && (
                        <div className="text-center py-8 text-slate-500">Berilgan filterlar bo'yicha ma'lumot topilmadi.</div>
                    )}
                </div>
            )}
        </div>
    );
};
