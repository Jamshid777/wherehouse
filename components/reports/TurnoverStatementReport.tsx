

import React, { useState, useMemo, useEffect } from 'react';
import { UseMockDataReturnType } from '../../hooks/useMockData';
import { Product, Warehouse, DocumentStatus, GoodsReceiptItem, InternalTransferItem, WriteOffItem, Stock, GoodsReturnItem, GoodsReturnNote, WriteOffNote, InternalTransferNote, GoodsReceiptNote } from '../../types';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';
import { ReceiptIcon } from '../icons/ReceiptIcon';
import { WriteOffIcon } from '../icons/WriteOffIcon';
import { TransferIcon } from '../icons/TransferIcon';
import { ReturnIcon } from '../icons/ReturnIcon';


interface TurnoverStatementReportProps {
    dataManager: UseMockDataReturnType;
    defaultWarehouseId: string | null;
    appMode: 'pro' | 'lite';
}

type TransactionDetail = {
    date: string;
    docNumber: string;
    docType: 'receipt' | 'writeoff' | 'transfer-in' | 'transfer-out' | 'return';
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

export const TurnoverStatementReport: React.FC<TurnoverStatementReportProps> = ({ dataManager, defaultWarehouseId, appMode }) => {
    const [reportData, setReportData] = useState<TurnoverData[] | null>(null);
    const [filters, setFilters] = useState({
        dateFrom: formatDate(new Date(new Date().setDate(new Date().getDate() - 7))),
        dateTo: formatDate(new Date()),
        warehouseId: defaultWarehouseId || 'all',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    useEffect(() => {
        setFilters(prev => ({ ...prev, warehouseId: defaultWarehouseId || 'all' }));
    }, [defaultWarehouseId]);

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
        const { products, goodsReceipts, writeOffs, internalTransfers, goodsReturns, warehouses, getStockAsOf } = dataManager;

        const turnoverResult: Map<string, TurnoverData> = new Map();
        products.forEach(p => {
             turnoverResult.set(p.id, {
                product: p, opening_qty: 0, opening_value: 0,
                debit_qty: 0, debit_value: 0, credit_qty: 0, credit_value: 0,
                closing_qty: 0, closing_value: 0, details: []
            });
        });

        const openingStockDate = new Date(startDate);
        openingStockDate.setDate(startDate.getDate() - 1);
        const openingStock = getStockAsOf(openingStockDate.toISOString());
        
        openingStock.forEach(stockItem => {
            const turnoverData = turnoverResult.get(stockItem.productId);
            if(turnoverData && (warehouseId === 'all' || stockItem.warehouseId === warehouseId)) {
                turnoverData.opening_qty += stockItem.quantity;
                turnoverData.opening_value += stockItem.quantity * stockItem.cost;
            }
        });

        let periodStock: Stock[] = JSON.parse(JSON.stringify(openingStock));
        
        const allDocs = [
            ...goodsReceipts.map(d => ({ ...d, docType: 'receipt' as const, date: new Date(d.date) })),
            ...writeOffs.map(d => ({ ...d, docType: 'writeoff' as const, date: new Date(d.date) })),
            ...internalTransfers.map(d => ({ ...d, docType: 'transfer' as const, date: new Date(d.date) })),
            ...goodsReturns.map(d => ({ ...d, docType: 'return' as const, date: new Date(d.date) }))
        ]
        .filter(d => d.status === DocumentStatus.CONFIRMED && new Date(d.date) >= startDate && new Date(d.date) <= endDate)
        .sort((a, b) => a.date.getTime() - b.date.getTime());
        
        const getWarehouseName = (id:string) => warehouses.find(w=>w.id===id)?.name || 'Noma\'lum';
        
        for (const doc of allDocs) {
            if (doc.docType === 'receipt') {
                doc.items.forEach(item => {
                    periodStock.push({
                        batchId: item.batchId,
                        productId: item.productId,
                        warehouseId: doc.warehouse_id,
                        quantity: item.quantity,
                        cost: item.price,
                        receiptDate: doc.date.toISOString(),
                        validDate: item.validDate
                    });
                    if (warehouseId === 'all' || doc.warehouse_id === warehouseId) {
                        const pTurnover = turnoverResult.get(item.productId)!;
                        pTurnover.debit_qty += item.quantity;
                        pTurnover.debit_value += item.quantity * item.price;
                        pTurnover.details.push({ date: doc.date.toISOString(), docNumber: doc.doc_number, docType: 'receipt', warehouseName: getWarehouseName(doc.warehouse_id), qtyChange: item.quantity, valueChange: item.quantity * item.price });
                    }
                });
            } else if (doc.docType === 'writeoff' || doc.docType === 'return') {
                 doc.items.forEach(item => {
                    let qtyToConsume = item.quantity;
                    let valueOfConsumed = 0;
                    const productBatches = periodStock
                        .filter(s => s.productId === item.productId && s.warehouseId === doc.warehouse_id)
                        .sort((a,b) => new Date(a.receiptDate).getTime() - new Date(b.receiptDate).getTime());
                    
                    for (const batch of productBatches) {
                        if (qtyToConsume <= 0) break;
                        const consumeAmount = Math.min(qtyToConsume, batch.quantity);
                        valueOfConsumed += consumeAmount * batch.cost;
                        batch.quantity -= consumeAmount;
                        qtyToConsume -= consumeAmount;
                    }

                    if (warehouseId === 'all' || doc.warehouse_id === warehouseId) {
                        const pTurnover = turnoverResult.get(item.productId)!;
                        pTurnover.credit_qty += item.quantity;
                        pTurnover.credit_value += valueOfConsumed;
                        pTurnover.details.push({ date: doc.date.toISOString(), docNumber: doc.doc_number, docType: doc.docType, warehouseName: getWarehouseName(doc.warehouse_id), qtyChange: -item.quantity, valueChange: -valueOfConsumed });
                    }
                });
                periodStock = periodStock.filter(s => s.quantity > 0.001);
            } else if (doc.docType === 'transfer') {
                doc.items.forEach(item => {
                    let qtyToTransfer = item.quantity;
                    let valueOfTransferred = 0;
                    const productBatches = periodStock
                        .filter(s => s.productId === item.productId && s.warehouseId === doc.from_warehouse_id)
                        .sort((a,b) => new Date(a.receiptDate).getTime() - new Date(b.receiptDate).getTime());
                    
                    for (const batch of productBatches) {
                        if (qtyToTransfer <= 0) break;
                        const transferAmount = Math.min(qtyToTransfer, batch.quantity);
                        valueOfTransferred += transferAmount * batch.cost;
                        batch.quantity -= transferAmount;
                        qtyToTransfer -= transferAmount;
                        periodStock.push({
                            batchId: `${batch.batchId}-t-${doc.id}`,
                            productId: item.productId,
                            warehouseId: doc.to_warehouse_id,
                            quantity: transferAmount,
                            cost: batch.cost,
                            receiptDate: doc.date.toISOString(),
                            validDate: batch.validDate
                        });
                    }

                    const pTurnover = turnoverResult.get(item.productId)!;
                    if (warehouseId === 'all' || doc.from_warehouse_id === warehouseId) {
                        pTurnover.credit_qty += item.quantity;
                        pTurnover.credit_value += valueOfTransferred;
                        pTurnover.details.push({ date: doc.date.toISOString(), docNumber: doc.doc_number, docType: 'transfer-out', warehouseName: getWarehouseName(doc.from_warehouse_id), qtyChange: -item.quantity, valueChange: -valueOfTransferred });
                    }
                    if (warehouseId === 'all' || doc.to_warehouse_id === warehouseId) {
                        pTurnover.debit_qty += item.quantity;
                        pTurnover.debit_value += valueOfTransferred;
                        pTurnover.details.push({ date: doc.date.toISOString(), docNumber: doc.doc_number, docType: 'transfer-in', warehouseName: getWarehouseName(doc.to_warehouse_id), qtyChange: item.quantity, valueChange: valueOfTransferred });
                    }
                });
                 periodStock = periodStock.filter(s => s.quantity > 0.001);
            }
        }
        
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

    const getDocIcon = (docType: TransactionDetail['docType']) => {
        switch(docType) {
            case 'receipt': return <span title="Kirim"><ReceiptIcon className="h-4 w-4 text-green-600" /></span>;
            case 'writeoff': return <span title="Chiqim"><WriteOffIcon className="h-4 w-4 text-red-600" /></span>;
            case 'return': return <span title="Qaytarish"><ReturnIcon className="h-4 w-4 text-orange-600" /></span>;
            case 'transfer-in': return <span title="Ichki kirim (ko'chirish)"><TransferIcon className="h-4 w-4 text-amber-600" /></span>;
            case 'transfer-out': return <span title="Ichki chiqim (ko'chirish)"><TransferIcon className="h-4 w-4 text-blue-600" /></span>;
            default: return null;
        }
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-2xl font-bold text-slate-800 mb-1">Aylanma Qaydnoma {appMode === 'pro' && '(FIFO)'}</h2>
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
                                <tr onClick={() => appMode === 'pro' && handleToggleExpand(d.product.id)} className={`border-b border-slate-200 ${appMode === 'pro' ? 'cursor-pointer' : ''} ${isExpanded ? 'bg-slate-100' : 'hover:bg-slate-50'}`}>
                                    <td className="px-4 py-3 font-medium text-slate-900 border-r border-slate-200">
                                        <div className="flex items-center gap-2">
                                            {appMode === 'pro' && <ChevronDownIcon className={`h-4 w-4 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />}
                                            {d.product.name}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right text-slate-600 border-r border-slate-200">{d.opening_qty.toFixed(2)}</td>
                                    <td className="px-4 py-3 text-right font-mono text-slate-600 border-r border-slate-200">{formatCurrency(d.opening_value)}</td>
                                    <td className="px-4 py-3 text-right text-green-700 border-r border-slate-200">{d.debit_qty.toFixed(2)}</td>
                                    <td className="px-4 py-3 text-right font-mono text-green-700 border-r border-slate-200">{formatCurrency(d.debit_value)}</td>
                                    <td className="px-4 py-3 text-right text-red-700 border-r border-slate-200">{d.credit_qty.toFixed(2)}</td>
                                    <td className="px-4 py-3 text-right font-mono text-red-700 border-r border-slate-200">{formatCurrency(d.credit_value)}</td>
                                    <td className="px-4 py-3 text-right font-bold text-slate-800 border-r border-slate-200">{d.closing_qty.toFixed(2)}</td>
                                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">{formatCurrency(d.closing_value)}</td>
                                </tr>
                                {appMode === 'pro' && (
                                  <tr>
                                    <td colSpan={9} className="p-0 border-0">
                                      <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                                        <div className="overflow-hidden">
                                          <div className="p-2 bg-slate-100">
                                              <div className="p-2 bg-white rounded-md border">
                                                  <h4 className="text-sm font-semibold mb-2 px-2">Harakatlar ({d.product.name})</h4>
                                                  <table className="w-full text-xs border-collapse">
                                                      <thead className="text-slate-500">
                                                          <tr>
                                                              <th className="px-2 py-1 text-left border-r border-slate-200">Sana</th>
                                                              <th className="px-2 py-1 text-left border-r border-slate-200">Hujjat</th>
                                                              <th className="px-2 py-1 text-left border-r border-slate-200">Turi</th>
                                                              <th className="px-2 py-1 text-left border-r border-slate-200">Ombor</th>
                                                              <th className="px-2 py-1 text-right border-r border-slate-200">Miqdor o'zgarishi</th>
                                                              <th className="px-2 py-1 text-right">Qiymat o'zgarishi</th>
                                                          </tr>
                                                      </thead>
                                                      <tbody>
                                                          {d.details.map((det, i) => (
                                                              <tr key={i} className="border-t">
                                                                  <td className="px-2 py-1.5 border-r border-slate-200">{new Date(det.date).toLocaleDateString()}</td>
                                                                  <td className="px-2 py-1.5 border-r border-slate-200">{det.docNumber}</td>
                                                                  <td className="px-2 py-1.5 capitalize border-r border-slate-200">
                                                                      {getDocIcon(det.docType)}
                                                                  </td>
                                                                  <td className="px-2 py-1.5 border-r border-slate-200">{det.warehouseName}</td>
                                                                  <td className={`px-2 py-1.5 text-right font-mono border-r border-slate-200 ${det.qtyChange > 0 ? 'text-green-600' : 'text-red-600'}`}>{det.qtyChange.toFixed(2)}</td>
                                                                  <td className={`px-2 py-1.5 text-right font-mono ${det.valueChange > 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(det.valueChange)}</td>
                                                              </tr>
                                                          ))}
                                                      </tbody>
                                                  </table>
                                              </div>
                                          </div>
                                        </div>
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
