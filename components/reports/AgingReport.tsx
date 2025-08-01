

import React, { useState, useMemo, useEffect } from 'react';
import { UseMockDataReturnType } from '../../hooks/useMockData';
import { DocumentStatus } from '../../types';
import { Modal } from '../Modal';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';

interface AgingReportProps {
    dataManager: UseMockDataReturnType;
}

interface AgingDocumentDetail {
    docId: string;
    docNumber: string;
    date: string;
    amount: number;
}

interface AgingBucket {
    total: number;
    docs: AgingDocumentDetail[];
}

interface AgingData {
    supplierId: string;
    supplierName: string;
    bucket1: AgingBucket; // 0-30 days
    bucket2: AgingBucket; // 31-60 days
    bucket3: AgingBucket; // 61-90 days
    bucket4: AgingBucket; // 90+ days
    total: number;
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('uz-UZ').format(amount);
const formatDate = (date: Date) => date.toISOString().split('T')[0];

export const AgingReport: React.FC<AgingReportProps> = ({ dataManager }) => {
    const { goodsReceipts, suppliers, payments, getNoteTotal, products } = dataManager;
    const [reportData, setReportData] = useState<AgingData[] | null>(null);
    const [asOfDate, setAsOfDate] = useState(formatDate(new Date()));
    const [isLoading, setIsLoading] = useState(true);
    const [modalData, setModalData] = useState<{ title: string; docs: AgingDocumentDetail[] } | null>(null);
    const [expandedModalDocs, setExpandedModalDocs] = useState<Set<string>>(new Set());

    const handleGenerateReport = () => {
        setIsLoading(true);
        const targetDate = new Date(asOfDate);
        targetDate.setHours(23, 59, 59, 999);

        const agingMap = new Map<string, AgingData>();

        suppliers.forEach(s => {
            const initialDebt = s.initial_balance > 0 ? s.initial_balance : 0;
            const initialDebtDoc: AgingDocumentDetail = { docNumber: "Boshlang'ich qoldiq", date: 'N/A', amount: initialDebt, docId: `initial_${s.id}` };
            agingMap.set(s.id, {
                supplierId: s.id,
                supplierName: s.name,
                bucket1: { total: 0, docs: [] },
                bucket2: { total: 0, docs: [] },
                bucket3: { total: 0, docs: [] },
                bucket4: { total: initialDebt, docs: initialDebt > 0 ? [initialDebtDoc] : [] },
                total: initialDebt,
            });
        });

        // Create a mutable copy of payments for each supplier
        const paymentPool = new Map<string, number>();
        payments
          .filter(p => new Date(p.date) <= targetDate)
          .forEach(p => {
            paymentPool.set(p.supplier_id, (paymentPool.get(p.supplier_id) || 0) + p.amount);
          });

        // Settle initial balances first
        suppliers.forEach(s => {
            let supplierPayments = paymentPool.get(s.id) || 0;
            if(supplierPayments > 0) {
                const agingData = agingMap.get(s.id)!;
                const initialDebtDoc = agingData.bucket4.docs.find(d => d.docId.startsWith('initial_'));
                 if (initialDebtDoc) {
                    const paidToInitial = Math.min(supplierPayments, initialDebtDoc.amount);
                    initialDebtDoc.amount -= paidToInitial;
                    agingData.bucket4.total -= paidToInitial;
                    agingData.total -= paidToInitial;
                    paymentPool.set(s.id, supplierPayments - paidToInitial);
                }
            }
        });
        
        const relevantReceipts = goodsReceipts
            .filter(n => n.status === DocumentStatus.CONFIRMED && new Date(n.date) <= targetDate && n.supplier_id !== 'SYSTEM')
            .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            
        relevantReceipts.forEach(note => {
            const agingData = agingMap.get(note.supplier_id);
            if (!agingData) return;

            let supplierPayments = paymentPool.get(note.supplier_id) || 0;
            const noteTotal = getNoteTotal(note.items);
            const paidForThisNote = Math.min(supplierPayments, noteTotal);
            const balance = noteTotal - paidForThisNote;

            paymentPool.set(note.supplier_id, supplierPayments - paidForThisNote);
            
            if (balance > 0.01) {
                const noteDate = new Date(note.date);
                const diffTime = targetDate.getTime() - noteDate.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                const docDetail: AgingDocumentDetail = { docId: note.id, docNumber: note.doc_number, date: note.date, amount: balance };
                
                if (diffDays <= 30) {
                    agingData.bucket1.total += balance;
                    agingData.bucket1.docs.push(docDetail);
                }
                else if (diffDays <= 60) {
                    agingData.bucket2.total += balance;
                    agingData.bucket2.docs.push(docDetail);
                }
                else if (diffDays <= 90) {
                    agingData.bucket3.total += balance;
                    agingData.bucket3.docs.push(docDetail);
                }
                else {
                    agingData.bucket4.total += balance;
                    agingData.bucket4.docs.push(docDetail);
                }
                
                agingData.total += balance;
            }
        });

        // Cleanup empty docs from initial balance
        agingMap.forEach(agingData => {
            if (agingData.bucket4.docs.length > 0) {
                agingData.bucket4.docs = agingData.bucket4.docs.filter(d => d.amount > 0.01);
            }
        });

        const data = Array.from(agingMap.values()).filter(d => d.total > 0.01);
        setReportData(data);
        setIsLoading(false);
    };
    
    useEffect(() => {
        handleGenerateReport();
    }, [asOfDate, dataManager]);

    const totals = useMemo(() => {
        if (!reportData) return null;
        return reportData.reduce((acc, curr) => ({
            bucket1: acc.bucket1 + curr.bucket1.total,
            bucket2: acc.bucket2 + curr.bucket2.total,
            bucket3: acc.bucket3 + curr.bucket3.total,
            bucket4: acc.bucket4 + curr.bucket4.total,
            total: acc.total + curr.total,
        }), { bucket1: 0, bucket2: 0, bucket3: 0, bucket4: 0, total: 0 });
    }, [reportData]);

    const handleCellClick = (supplierName: string, bucketName: string, docs: AgingDocumentDetail[]) => {
        if (docs.length === 0) return;
        setModalData({
            title: `${supplierName} / ${bucketName}`,
            docs: docs
        });
    };
    
    const handleCloseModal = () => {
        setModalData(null);
        setExpandedModalDocs(new Set());
    };

    const toggleModalDocExpand = (docId: string) => {
        if (docId.startsWith('initial_')) return;
        setExpandedModalDocs(prev => {
            const newSet = new Set(prev);
            if (newSet.has(docId)) {
                newSet.delete(docId);
            } else {
                newSet.add(docId);
            }
            return newSet;
        });
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                 <h2 className="text-2xl font-bold text-slate-800">Qarzdorlik muddati bo'yicha hisobot (Aging)</h2>
                 <div>
                    <label htmlFor="asOfDate" className="text-sm font-medium text-slate-700 mr-2">Sana bo'yicha</label>
                    <input
                        type="date"
                        id="asOfDate"
                        value={asOfDate}
                        onChange={e => setAsOfDate(e.target.value)}
                        className="px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500"
                    />
                </div>
            </div>

            {isLoading && <div className="text-center py-10">Yuklanmoqda...</div>}

            {!isLoading && reportData && (
                <>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 tracking-wider">
                                <tr>
                                    <th className="px-4 py-3 text-left border-r border-slate-200">Yetkazib beruvchi</th>
                                    <th className="px-4 py-3 text-right border-r border-slate-200">0-30 kun</th>
                                    <th className="px-4 py-3 text-right border-r border-slate-200">31-60 kun</th>
                                    <th className="px-4 py-3 text-right border-r border-slate-200">61-90 kun</th>
                                    <th className="px-4 py-3 text-right border-r border-slate-200">90+ kun</th>
                                    <th className="px-4 py-3 text-right font-bold">Jami qarz</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {reportData.map(d => (
                                    <tr key={d.supplierId} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 font-medium text-slate-900 border-r border-slate-200">{d.supplierName}</td>
                                        <td className="px-4 py-3 text-right font-mono text-slate-600 border-r border-slate-200">
                                            <button 
                                                onClick={() => handleCellClick(d.supplierName, '0-30 kun', d.bucket1.docs)}
                                                disabled={d.bucket1.total === 0}
                                                className="w-full text-right disabled:cursor-default hover:text-amber-600 hover:underline disabled:hover:no-underline disabled:hover:text-slate-600"
                                            >
                                                {formatCurrency(d.bucket1.total)}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono text-slate-600 border-r border-slate-200">
                                            <button 
                                                onClick={() => handleCellClick(d.supplierName, '31-60 kun', d.bucket2.docs)}
                                                disabled={d.bucket2.total === 0}
                                                className="w-full text-right disabled:cursor-default hover:text-amber-600 hover:underline disabled:hover:no-underline disabled:hover:text-slate-600"
                                            >
                                                {formatCurrency(d.bucket2.total)}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono text-slate-600 border-r border-slate-200">
                                            <button 
                                                onClick={() => handleCellClick(d.supplierName, '61-90 kun', d.bucket3.docs)}
                                                disabled={d.bucket3.total === 0}
                                                className="w-full text-right disabled:cursor-default hover:text-amber-600 hover:underline disabled:hover:no-underline disabled:hover:text-slate-600"
                                            >
                                                {formatCurrency(d.bucket3.total)}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono text-slate-600 border-r border-slate-200">
                                            <button 
                                                onClick={() => handleCellClick(d.supplierName, '90+ kun', d.bucket4.docs)}
                                                disabled={d.bucket4.total === 0}
                                                className="w-full text-right disabled:cursor-default hover:text-amber-600 hover:underline disabled:hover:no-underline disabled:hover:text-slate-600"
                                            >
                                                {formatCurrency(d.bucket4.total)}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">{formatCurrency(d.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            {totals && (
                                <tfoot className="bg-slate-50 font-bold">
                                    <tr>
                                        <td className="px-4 py-3 text-left border-r border-slate-200">Jami</td>
                                        <td className="px-4 py-3 text-right font-mono border-r border-slate-200">{formatCurrency(totals.bucket1)}</td>
                                        <td className="px-4 py-3 text-right font-mono border-r border-slate-200">{formatCurrency(totals.bucket2)}</td>
                                        <td className="px-4 py-3 text-right font-mono border-r border-slate-200">{formatCurrency(totals.bucket3)}</td>
                                        <td className="px-4 py-3 text-right font-mono border-r border-slate-200">{formatCurrency(totals.bucket4)}</td>
                                        <td className="px-4 py-3 text-right font-mono text-lg text-slate-900">{formatCurrency(totals.total)}</td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                         {reportData.length === 0 && (
                            <div className="text-center py-8 text-slate-500">Qarzdorliklar mavjud emas.</div>
                        )}
                    </div>
                    {modalData && (
                        <Modal isOpen={!!modalData} onClose={handleCloseModal} title={modalData.title} size="2xl">
                             <div className="overflow-x-auto">
                                <table className="w-full text-sm border-collapse">
                                    <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left border-r border-slate-200">Hujjat Raqami</th>
                                            <th className="px-4 py-2 text-left border-r border-slate-200">Sana</th>
                                            <th className="px-4 py-2 text-right">Summa</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {modalData.docs.map(doc => {
                                            const isExpandable = !doc.docId.startsWith('initial_');
                                            const isExpanded = expandedModalDocs.has(doc.docId);
                                            const noteDetails = isExpandable ? goodsReceipts.find(gr => gr.id === doc.docId) : null;
                                            
                                            return (
                                                <React.Fragment key={doc.docId}>
                                                    <tr 
                                                        className={isExpandable ? "cursor-pointer hover:bg-slate-50" : ""}
                                                        onClick={() => toggleModalDocExpand(doc.docId)}
                                                    >
                                                        <td className="px-4 py-2 font-medium border-r border-slate-200">
                                                            <div className="flex items-center gap-2">
                                                                {isExpandable && <ChevronDownIcon className={`h-4 w-4 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />}
                                                                {doc.docNumber}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2 border-r border-slate-200">{doc.date === 'N/A' ? 'N/A' : new Date(doc.date).toLocaleDateString()}</td>
                                                        <td className="px-4 py-2 font-mono text-right">{formatCurrency(doc.amount)}</td>
                                                    </tr>
                                                    {isExpanded && noteDetails && (
                                                        <tr>
                                                            <td colSpan={3} className="p-2 bg-slate-50">
                                                                <div className="bg-white p-3 rounded-md border">
                                                                    <h5 className="font-semibold text-slate-700 text-xs mb-2">Hujjat tarkibi:</h5>
                                                                    <table className="w-full text-xs">
                                                                        <thead>
                                                                            <tr className="border-b">
                                                                                <th className="p-1 text-left font-medium">Mahsulot</th>
                                                                                <th className="p-1 text-right font-medium">Miqdor</th>
                                                                                <th className="p-1 text-right font-medium">Narx</th>
                                                                                <th className="p-1 text-right font-medium">Summa</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {noteDetails.items.map((item, itemIdx) => {
                                                                                const product = products.find(p => p.id === item.productId);
                                                                                return (
                                                                                    <tr key={itemIdx} className="border-b last:border-b-0">
                                                                                        <td className="p-1.5">{product?.name || 'Noma\'lum'}</td>
                                                                                        <td className="p-1.5 text-right font-mono">{item.quantity}</td>
                                                                                        <td className="p-1.5 text-right font-mono">{formatCurrency(item.price)}</td>
                                                                                        <td className="p-1.5 text-right font-mono">{formatCurrency(item.quantity * item.price)}</td>
                                                                                    </tr>
                                                                                )
                                                                            })}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            )
                                        })}
                                    </tbody>
                                    <tfoot className="bg-slate-50 font-bold">
                                        <tr>
                                            <td colSpan={2} className="px-4 py-2 text-right border-r border-slate-200">Jami:</td>
                                            <td className="px-4 py-2 text-right font-mono">{formatCurrency(modalData.docs.reduce((sum, d) => sum + d.amount, 0))}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </Modal>
                    )}
                </>
            )}
        </div>
    );
};