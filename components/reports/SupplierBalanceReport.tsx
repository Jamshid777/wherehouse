

import React, { useState, useMemo, useEffect } from 'react';
import { UseMockDataReturnType } from '../../hooks/useMockData';
import { DocumentStatus, GoodsReceiptNote, Payment, GoodsReceiptItem, Product, GoodsReturnNote } from '../../types';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';

interface SupplierBalanceReportProps {
    dataManager: UseMockDataReturnType;
}

type DetailItem = (GoodsReceiptNote & {docType: 'receipt'}) | (Payment & {docType: 'payment'}) | (GoodsReturnNote & {docType: 'return'});

interface BalanceData {
    supplierId: string;
    supplierName: string;
    initialBalance: number;
    balance: number;
    details: DetailItem[];
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('uz-UZ').format(amount);
const formatDate = (date: Date) => date.toISOString().split('T')[0];

export const SupplierBalanceReport: React.FC<SupplierBalanceReportProps> = ({ dataManager }) => {
    const { goodsReceipts, suppliers, payments, getNoteTotal, products, goodsReturns } = dataManager;
    const [reportData, setReportData] = useState<BalanceData[] | null>(null);
    const [asOfDate, setAsOfDate] = useState(formatDate(new Date()));
    const [isLoading, setIsLoading] = useState(false);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set());

    const handleToggleExpand = (supplierId: string) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(supplierId)) newSet.delete(supplierId);
            else newSet.add(supplierId);
            return newSet;
        });
    };
    
    const handleToggleDocExpand = (docId: string) => {
        setExpandedDocs(prev => {
            const newSet = new Set(prev);
            if (newSet.has(docId)) {
                newSet.delete(docId);
            } else {
                newSet.add(docId);
            }
            return newSet;
        });
    };

    const handleGenerateReport = () => {
        setIsLoading(true);
        const targetDate = new Date(asOfDate);
        targetDate.setHours(23,59,59,999);

        const balanceMap = new Map<string, BalanceData>();
        
        const relevantSuppliers = suppliers.filter(s => s.id !== 'SYSTEM');

        relevantSuppliers.forEach(s => {
            const receipts = goodsReceipts.filter(n => n.supplier_id === s.id && n.status === DocumentStatus.CONFIRMED && new Date(n.date) <= targetDate);
            const supplierPayments = payments.filter(p => p.supplier_id === s.id && new Date(p.date) <= targetDate);
            const supplierReturns = goodsReturns.filter(n => n.supplier_id === s.id && n.status === DocumentStatus.CONFIRMED && new Date(n.date) <= targetDate);
            
            const totalDebt = receipts.reduce((sum, n) => sum + getNoteTotal(n.items), 0);
            const totalPaid = supplierPayments.reduce((sum, p) => sum + p.amount, 0);
            const totalReturned = supplierReturns.reduce((sum, n) => sum + n.items.reduce((itemSum, item) => itemSum + item.quantity * item.cost, 0), 0);
            
            const balance = s.initial_balance + totalDebt - totalPaid - totalReturned;

            const details: DetailItem[] = [
                ...receipts.map(d => ({...d, docType: 'receipt' as const})),
                ...supplierPayments.map(d => ({...d, docType: 'payment' as const})),
                ...supplierReturns.map(d => ({...d, docType: 'return' as const})),
            ].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            balanceMap.set(s.id, {
                supplierId: s.id,
                supplierName: s.name,
                initialBalance: s.initial_balance,
                balance,
                details
            });
        });
        
        const data = Array.from(balanceMap.values()).filter(d => d.balance !== 0 || d.details.length > 0);
        setReportData(data);
        setIsLoading(false);
    };

    useEffect(() => {
        handleGenerateReport();
    }, [asOfDate, dataManager]);
    
    const totals = useMemo(() => {
        if (!reportData) return null;
        return reportData.reduce((acc, curr) => acc + curr.balance, 0);
    }, [reportData]);

    const getProduct = (id: string): Product | undefined => products.find(p => p.id === id);

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Yetkazib beruvchilar bo'yicha balans</h2>
                 <div>
                    <label htmlFor="asOfDate" className="text-sm font-medium text-slate-700 mr-2">Sana bo'yicha</label>
                    <input
                        type="date"
                        id="asOfDate"
                        value={asOfDate}
                        onChange={e => setAsOfDate(e.target.value)}
                        className="px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                    />
                </div>
            </div>
            
            {isLoading && <div className="text-center py-10">Yuklanmoqda...</div>}

            {!isLoading && reportData && (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 tracking-wider">
                            <tr>
                                <th className="px-6 py-3 text-left w-4/5 border-r border-slate-200">Yetkazib beruvchi</th>
                                <th className="px-6 py-3 text-right font-bold">Joriy Balans</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.map(d => {
                                const isExpanded = expandedRows.has(d.supplierId);
                                return (
                                <React.Fragment key={d.supplierId}>
                                <tr onClick={() => handleToggleExpand(d.supplierId)} className="hover:bg-slate-50 cursor-pointer border-b border-slate-200">
                                    <td className="px-6 py-4 font-medium text-slate-900 border-r border-slate-200">
                                        <div className="flex items-center gap-2">
                                            <ChevronDownIcon className={`h-4 w-4 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                                            {d.supplierName}
                                        </div>
                                    </td>
                                    <td className={`px-6 py-4 text-right font-mono font-bold ${d.balance > 0 ? 'text-red-600' : d.balance < 0 ? 'text-green-600' : 'text-slate-800'}`}>
                                        {formatCurrency(d.balance)}
                                    </td>
                                </tr>
                                {isExpanded && (
                                    <tr className="bg-slate-50/50">
                                        <td colSpan={2} className="p-2">
                                             <div className="p-2 bg-white rounded-md border">
                                                <h4 className="text-sm font-semibold mb-2 px-2">Hujjatlar ({d.supplierName})</h4>
                                                <table className="w-full text-xs border-collapse">
                                                    <thead className="text-slate-500">
                                                        <tr>
                                                            <th className="px-2 py-1 text-left border-r border-slate-200">Sana</th>
                                                            <th className="px-2 py-1 text-left border-r border-slate-200">Hujjat</th>
                                                            <th className="px-2 py-1 text-left border-r border-slate-200">Turi</th>
                                                            <th className="px-2 py-1 text-right border-r border-slate-200">Qarz (Kirim)</th>
                                                            <th className="px-2 py-1 text-right">To'lov / Qaytarish</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr className="border-t bg-slate-100">
                                                            <td colSpan={3} className="px-2 py-1.5 font-semibold text-slate-600 border-r border-slate-200">Boshlang'ich qoldiq</td>
                                                            <td className="px-2 py-1.5 text-right font-mono text-green-700 border-r border-slate-200">{d.initialBalance > 0 ? formatCurrency(d.initialBalance) : '-'}</td>
                                                            <td className="px-2 py-1.5 text-right font-mono text-red-700">{d.initialBalance < 0 ? formatCurrency(Math.abs(d.initialBalance)) : '-'}</td>
                                                        </tr>
                                                        {d.details.map((det, i) => {
                                                            const isReceipt = det.docType === 'receipt';
                                                            const isPayment = det.docType === 'payment';
                                                            const isReturn = det.docType === 'return';
                                                            const isDocExpanded = (isReceipt || isReturn) && expandedDocs.has(det.id);

                                                            const docAmount = isPayment ? det.amount : isReturn ? det.items.reduce((s,i) => s + i.quantity * i.cost, 0) : 0;

                                                            return (
                                                                <React.Fragment key={i}>
                                                                    <tr 
                                                                        className={`border-t ${(isReceipt || isReturn) ? 'cursor-pointer hover:bg-slate-200/50' : ''}`}
                                                                        onClick={() => (isReceipt || isReturn) && handleToggleDocExpand(det.id)}
                                                                    >
                                                                        <td className="px-2 py-1.5 border-r border-slate-200">{new Date(det.date).toLocaleDateString()}</td>
                                                                        <td className="px-2 py-1.5 border-r border-slate-200">
                                                                            <div className="flex items-center gap-1">
                                                                                {(isReceipt || isReturn) && <ChevronDownIcon className={`h-4 w-4 text-slate-400 transition-transform ${isDocExpanded ? '' : '-rotate-90'}`} />}
                                                                                <span>{det.doc_number}</span>
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-2 py-1.5 border-r border-slate-200">{isReceipt ? "Kirim" : isReturn ? "Qaytarish" : "To'lov"}</td>
                                                                        <td className="px-2 py-1.5 text-right font-mono text-green-700 border-r border-slate-200">{isReceipt ? formatCurrency(getNoteTotal(det.items)) : '-'}</td>
                                                                        <td className="px-2 py-1.5 text-right font-mono text-red-700">{docAmount > 0 ? formatCurrency(docAmount) : '-'}</td>
                                                                    </tr>
                                                                    {isDocExpanded && (isReceipt || isReturn) && 'items' in det && (
                                                                        <tr className="border-t">
                                                                            <td colSpan={5} className="p-2 pt-0 bg-slate-50">
                                                                                <div className="text-xs bg-white p-2 rounded border">
                                                                                    <h5 className="font-semibold text-slate-600 mb-1">Mahsulotlar:</h5>
                                                                                    {det.items.map((item, itemIdx) => (
                                                                                        <div key={itemIdx} className="flex justify-between items-center py-0.5">
                                                                                            <span>- {getProduct(item.productId)?.name}</span>
                                                                                            {isReceipt && 'price' in item && <span className="font-mono">{item.quantity} x {formatCurrency(item.price)} = {formatCurrency(item.quantity * item.price)}</span>}
                                                                                            {isReturn && 'cost' in item && <span className="font-mono">{item.quantity} x {formatCurrency(item.cost)} = {formatCurrency(item.quantity * item.cost)}</span>}
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    )}
                                                                </React.Fragment>
                                                            )
                                                        })}
                                                    </tbody>
                                                </table>
                                             </div>
                                        </td>
                                    </tr>
                                )}

                                </React.Fragment>
                            )})
                            }
                        </tbody>
                         {totals !== null && (
                            <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300">
                                <tr>
                                    <td className="px-6 py-3 text-left border-r border-slate-200">Jami</td>
                                    <td className={`px-6 py-3 text-right font-mono text-lg ${totals > 0 ? 'text-red-600' : totals < 0 ? 'text-green-600' : 'text-slate-900'}`}>
                                        {formatCurrency(totals)}
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                     {reportData.length === 0 && (
                        <div className="text-center py-8 text-slate-500">Hisobot uchun ma'lumot topilmadi.</div>
                    )}
                </div>
            )}
        </div>
    );
};