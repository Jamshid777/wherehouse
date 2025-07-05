

import React, { useState, useMemo, useEffect } from 'react';
import { UseMockDataReturnType } from '../../hooks/useMockData';
import { Product, Warehouse, DocumentStatus, GoodsReceiptItem, InternalTransferItem, WriteOffItem, Stock } from '../../types';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';
import { ReceiptIcon } from '../icons/ReceiptIcon';
import { WriteOffIcon } from '../icons/WriteOffIcon';
import { TransferIcon } from '../icons/TransferIcon';


interface TurnoverStatementReportProps {
    dataManager: UseMockDataReturnType;
}

type TransactionDetail = {
    date: string;
    docNumber: string;
    docType: 'receipt' | 'writeoff' | 'transfer-in' | 'transfer-out';
    warehouseName: string;
    qtyChange: number;
    valueChange: number;
}

interface TurnoverData {
    product: Product;
    opening_qty: number;
    opening_value: number;
    debit_qty: number;
    debit_value: number;
    credit_qty: number;
    credit_value: number;
    closing_qty: number;
    closing_value: number;
    details: TransactionDetail[];
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('uz-UZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
const formatDate = (date: Date) => date.toISOString().split('T')[0];

export const TurnoverStatementReport: React.FC<TurnoverStatementReportProps> = ({ dataManager }) => {
    const [reportData, setReportData] = useState<TurnoverData[] | null>(null);
    const [filters, setFilters] = useState({
        dateFrom: formatDate(new Date(new Date().setDate(new Date().getDate() - 7))),
        dateTo: formatDate(new Date()),
        warehouseId: 'all',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    const handleToggleExpand = (productId: string) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(productId)) newSet.delete(productId);
            else newSet.add(productId);
            return newSet;
        });
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
    }

    const calculateTurnover = () => {
        const { dateFrom, dateTo, warehouseId } = filters;
        const startDate = new Date(dateFrom);
        startDate.setHours(0,0,0,0);
        const endDate = new Date(dateTo);
        endDate.setHours(23,59,59,999);
        const { products, goodsReceipts, writeOffs, internalTransfers, warehouses } = dataManager;

        const allDocs = [
            ...goodsReceipts.map(d => ({ ...d, docType: 'receipt' as const, date: new Date(d.date) })),
            ...writeOffs.map(d => ({ ...d, docType: 'writeoff' as const, date: new Date(d.date) })),
            ...internalTransfers.map(d => ({ ...d, docType: 'transfer' as const, date: new Date(d.date) }))
        ]
        .filter(d => d.status === DocumentStatus.CONFIRMED)
        .sort((a, b) => a.date.getTime() - b.date.getTime());

        const turnoverResult: Map<string, TurnoverData> = new Map();
        products.forEach(p => {
             turnoverResult.set(p.id, {
                product: p, opening_qty: 0, opening_value: 0,
                debit_qty: 0, debit_value: 0, credit_qty: 0, credit_value: 0,
                closing_qty: 0, closing_value: 0, details: []
            });
        });

        // 1. Calculate opening balance
        const docsBefore = allDocs.filter(d => d.date < startDate);
        docsBefore.forEach(doc => {
            const processDoc = (items: any[], sign: 1 | -1, type: 'receipt' | 'writeoff' | 'transfer', warehouseSpecificId?: string) => {
                if(warehouseId !== 'all' && warehouseSpecificId !== warehouseId) return;

                items.forEach((item: any) => {
                     const pTurnover = turnoverResult.get(item.productId)!;
                     const value = type === 'receipt' ? item.price : item.cost;
                     pTurnover.opening_qty += item.quantity * sign;
                     pTurnover.opening_value += item.quantity * value * sign;
                });
            }

            switch(doc.docType) {
                case 'receipt':
                    processDoc(doc.items, 1, 'receipt', doc.warehouse_id);
                    break;
                case 'writeoff':
                    processDoc(doc.items, -1, 'writeoff', doc.warehouse_id);
                    break;
                case 'transfer':
                    // From warehouse (credit)
                    processDoc(doc.items, -1, 'writeoff', doc.from_warehouse_id);
                     // To warehouse (debit)
                    processDoc(doc.items, 1, 'receipt', doc.to_warehouse_id);
                    break;
            }
        });

        // 2. Calculate turnover for the period
        const docsDuring = allDocs.filter(d => d.date >= startDate && d.date <= endDate);

        docsDuring.forEach(doc => {
            const getWarehouseName = (id:string) => warehouses.find(w=>w.id===id)?.name || 'Noma\'lum';
            switch(doc.docType) {
                case 'receipt':
                    if (warehouseId === 'all' || doc.warehouse_id === warehouseId) {
                        doc.items.forEach(item => {
                            const pTurnover = turnoverResult.get(item.productId)!;
                            pTurnover.debit_qty += item.quantity;
                            pTurnover.debit_value += item.quantity * item.price;
                            pTurnover.details.push({ date: doc.date.toISOString(), docNumber: doc.doc_number, docType: 'receipt', warehouseName: getWarehouseName(doc.warehouse_id), qtyChange: item.quantity, valueChange: item.quantity * item.price });
                        });
                    }
                    break;
                case 'writeoff':
                    if (warehouseId === 'all' || doc.warehouse_id === warehouseId) {
                       doc.items.forEach(item => {
                            const pTurnover = turnoverResult.get(item.productId)!;
                            pTurnover.credit_qty += item.quantity;
                            pTurnover.credit_value += item.quantity * item.cost;
                            pTurnover.details.push({ date: doc.date.toISOString(), docNumber: doc.doc_number, docType: 'writeoff', warehouseName: getWarehouseName(doc.warehouse_id), qtyChange: -item.quantity, valueChange: -item.quantity * item.cost });
                       });
                    }
                    break;
                case 'transfer':
                    doc.items.forEach(item => {
                        const batchCost = dataManager.stock.find(s=>s.productId === item.productId && s.batch_number === item.batch_number)?.cost || 0;
                        const pTurnover = turnoverResult.get(item.productId)!;
                        if (warehouseId === 'all' || doc.from_warehouse_id === warehouseId) {
                            pTurnover.credit_qty += item.quantity;
                            pTurnover.credit_value += item.quantity * batchCost;
                            pTurnover.details.push({ date: doc.date.toISOString(), docNumber: doc.doc_number, docType: 'transfer-out', warehouseName: getWarehouseName(doc.from_warehouse_id), qtyChange: -item.quantity, valueChange: -item.quantity * batchCost });
                        }
                        if (warehouseId === 'all' || doc.to_warehouse_id === warehouseId) {
                            pTurnover.debit_qty += item.quantity;
                            pTurnover.debit_value += item.quantity * batchCost;
                            pTurnover.details.push({ date: doc.date.toISOString(), docNumber: doc.doc_number, docType: 'transfer-in', warehouseName: getWarehouseName(doc.to_warehouse_id), qtyChange: item.quantity, valueChange: item.quantity * batchCost });
                        }
                    });
                    break;
            }
        });
        
        turnoverResult.forEach(data => {
            data.closing_qty = data.opening_qty + data.debit_qty - data.credit_qty;
            data.closing_value = data.opening_value + data.debit_value - data.credit_value;
            data.details.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        });

        return Array.from(turnoverResult.values()).filter(d => 
            d.opening_qty !== 0 || d.debit_qty !== 0 || d.credit_qty !== 0 || d.closing_qty !== 0
        );
    };

    const handleGenerateReport = () => {
        setIsLoading(true);
        setReportData(null);
        setTimeout(() => { 
            const data = calculateTurnover();
            setReportData(data);
            setIsLoading(false);
        }, 50);
    };

    useEffect(() => {
        handleGenerateReport();
    }, [filters, dataManager]);


    const dateRangeText = useMemo(() => {
        const from = new Date(filters.dateFrom).toLocaleDateString('uz-UZ');
        const to = new Date(filters.dateTo).toLocaleDateString('uz-UZ');
        return `${from} - ${to} oralig'idagi harakat`;
    }, [filters.dateFrom, filters.dateTo])

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-2xl font-bold text-slate-800 mb-1">Aylanma Qaydnoma</h2>
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
                 <div className="flex items-center gap-2 self-end">
                    <button onClick={() => handleDatePreset('today')} className="px-3 py-2 text-sm bg-slate-200 rounded-md hover:bg-slate-300 transition-colors">Bugun</button>
                    <button onClick={() => handleDatePreset('week')} className="px-3 py-2 text-sm bg-slate-200 rounded-md hover:bg-slate-300 transition-colors">Hafta</button>
                    <button onClick={() => handleDatePreset('month')} className="px-3 py-2 text-sm bg-slate-200 rounded-md hover:bg-slate-300 transition-colors">Oy</button>
                </div>
                <div>
                    <label htmlFor="warehouseId" className="block text-sm font-medium text-slate-700 mb-1">Ombor</label>
                    <select name="warehouseId" value={filters.warehouseId} onChange={handleFilterChange} className="w-full md:w-48 px-3 py-2.5 border border-slate-300 rounded-lg text-sm">
                        <option value="all">Barchasi</option>
                        {dataManager.warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                </div>
            </div>

            {isLoading && <div className="text-center py-8">Yuklanmoqda...</div>}

            {reportData && (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        <thead className="text-xs uppercase bg-slate-100/80 tracking-wider text-slate-500 sticky top-0 z-10">
                             <tr>
                                <th rowSpan={2} className="px-4 py-3 border border-slate-200 align-middle text-left w-1/5">Mahsulot</th>
                                <th colSpan={2} className="px-4 py-3 border border-slate-200 text-center">Boshlang'ich qoldiq</th>
                                <th colSpan={2} className="px-4 py-3 border border-slate-200 text-center text-green-600">Kirim</th>
                                <th colSpan={2} className="px-4 py-3 border border-slate-200 text-center text-red-600">Chiqim</th>
                                <th colSpan={2} className="px-4 py-3 border border-slate-200 text-center">Oxirgi qoldiq</th>
                            </tr>
                            <tr>
                                <th className="px-2 py-2 border border-slate-200 font-medium text-right">Miqdor</th>
                                <th className="px-2 py-2 border border-slate-200 font-medium text-right">Summa</th>
                                <th className="px-2 py-2 border border-slate-200 font-medium text-right">Miqdor</th>
                                <th className="px-2 py-2 border border-slate-200 font-medium text-right">Summa</th>
                                <th className="px-2 py-2 border border-slate-200 font-medium text-right">Miqdor</th>
                                <th className="px-2 py-2 border border-slate-200 font-medium text-right">Summa</th>
                                <th className="px-2 py-2 border border-slate-200 font-medium text-right">Miqdor</th>
                                <th className="px-2 py-2 border border-slate-200 font-medium text-right">Summa</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.map(d => {
                                const isExpanded = expandedRows.has(d.product.id);
                                return (
                                <React.Fragment key={d.product.id}>
                                <tr onClick={() => handleToggleExpand(d.product.id)} className="hover:bg-slate-50 cursor-pointer border-b border-slate-200">
                                    <td className="px-4 py-3 font-medium text-slate-900">
                                        <div className="flex items-center gap-2">
                                            <ChevronDownIcon className={`h-4 w-4 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                                            {d.product.name}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right text-slate-600">{d.opening_qty.toFixed(2)}</td>
                                    <td className="px-4 py-3 text-right font-mono text-slate-600">{formatCurrency(d.opening_value)}</td>
                                    <td className="px-4 py-3 text-right text-green-700">{d.debit_qty.toFixed(2)}</td>
                                    <td className="px-4 py-3 text-right font-mono text-green-700">{formatCurrency(d.debit_value)}</td>
                                    <td className="px-4 py-3 text-right text-red-700">{d.credit_qty.toFixed(2)}</td>
                                    <td className="px-4 py-3 text-right font-mono text-red-700">{formatCurrency(d.credit_value)}</td>
                                    <td className="px-4 py-3 text-right font-bold text-slate-800">{d.closing_qty.toFixed(2)}</td>
                                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">{formatCurrency(d.closing_value)}</td>
                                </tr>
                                {isExpanded && (
                                    <tr className="bg-slate-50/50">
                                        <td colSpan={9} className="p-2">
                                            <div className="p-2 bg-white rounded-md border">
                                                <h4 className="text-sm font-semibold mb-2 px-2">Harakatlar ({d.product.name})</h4>
                                                <table className="w-full text-xs">
                                                    <thead className="text-slate-500">
                                                        <tr>
                                                            <th className="px-2 py-1 text-left">Sana</th>
                                                            <th className="px-2 py-1 text-left">Hujjat</th>
                                                            <th className="px-2 py-1 text-left">Turi</th>
                                                            <th className="px-2 py-1 text-left">Ombor</th>
                                                            <th className="px-2 py-1 text-right">Miqdor o'zgarishi</th>
                                                            <th className="px-2 py-1 text-right">Qiymat o'zgarishi</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {d.details.map((det, i) => (
                                                            <tr key={i} className="border-t">
                                                                <td className="px-2 py-1.5">{new Date(det.date).toLocaleDateString()}</td>
                                                                <td className="px-2 py-1.5">{det.docNumber}</td>
                                                                <td className="px-2 py-1.5 capitalize" title={det.docType}>
                                                                    { det.docType === 'receipt' ? <ReceiptIcon className="h-4 w-4 text-green-600" /> 
                                                                    : det.docType === 'writeoff' ? <WriteOffIcon className="h-4 w-4 text-red-600" />
                                                                    : <TransferIcon className="h-4 w-4 text-blue-600" />
                                                                    }
                                                                </td>
                                                                <td className="px-2 py-1.5">{det.warehouseName}</td>
                                                                <td className={`px-2 py-1.5 text-right font-mono ${det.qtyChange > 0 ? 'text-green-600' : 'text-red-600'}`}>{det.qtyChange.toFixed(2)}</td>
                                                                <td className={`px-2 py-1.5 text-right font-mono ${det.valueChange > 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(det.valueChange)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                     {reportData.length === 0 && !isLoading && (
                        <div className="text-center py-8 text-slate-500">Berilgan filterlar bo'yicha ma'lumot topilmadi.</div>
                    )}
                </div>
            )}
        </div>
    );
};
