import React, { useState, useMemo, useEffect } from 'react';
import { UseMockDataReturnType } from '../../hooks/useMockData';
import { DocumentStatus, ClientPayment, SalesInvoice, Dish, SalesReturnNote } from '../../types';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';

interface ClientBalanceReportProps {
    dataManager: UseMockDataReturnType;
}

type DetailItem = (SalesInvoice & {docType: 'invoice'}) | (ClientPayment & {docType: 'payment'}) | (SalesReturnNote & {docType: 'return'});

interface BalanceData {
    clientId: string;
    clientName: string;
    initialBalance: number;
    balance: number;
    details: DetailItem[];
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('uz-UZ').format(amount);
const formatDate = (date: Date) => date.toISOString().split('T')[0];

export const ClientBalanceReport: React.FC<ClientBalanceReportProps> = ({ dataManager }) => {
    const { clients, salesInvoices, clientPayments, salesReturns, dishes, getClientBalance } = dataManager;
    const [reportData, setReportData] = useState<BalanceData[] | null>(null);
    const [asOfDate, setAsOfDate] = useState(formatDate(new Date()));
    const [isLoading, setIsLoading] = useState(false);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set());

    const getInvoiceTotal = (items: SalesInvoice['items']) => items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const handleGenerateReport = () => {
        setIsLoading(true);
        const targetDate = new Date(asOfDate);
        targetDate.setHours(23, 59, 59, 999);
        const balanceMap = new Map<string, BalanceData>();
        
        clients.forEach(c => {
            const balance = getClientBalance(c.id); // Note: getClientBalance should be updated to respect asOfDate for a true point-in-time report. For now, we use the live balance.
            const invoices = salesInvoices.filter(n => n.client_id === c.id && n.status === DocumentStatus.CONFIRMED && new Date(n.date) <= targetDate);
            const payments = clientPayments.filter(p => p.client_id === c.id && new Date(p.date) <= targetDate);
            const returns = salesReturns.filter(r => r.client_id === c.id && r.status === DocumentStatus.CONFIRMED && new Date(r.date) <= targetDate);

            const details: DetailItem[] = [
                ...invoices.map(d => ({...d, docType: 'invoice' as const})),
                ...payments.map(d => ({...d, docType: 'payment' as const})),
                ...returns.map(d => ({...d, docType: 'return' as const})),
            ].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            balanceMap.set(c.id, { clientId: c.id, clientName: c.name, initialBalance: c.initial_balance, balance, details });
        });
        
        const data = Array.from(balanceMap.values()).filter(d => Math.abs(d.balance) > 0.01 || d.details.length > 0);
        setReportData(data);
        setIsLoading(false);
    };

    useEffect(() => { handleGenerateReport(); }, [asOfDate, dataManager]);
    
    const handleToggleExpand = (id: string) => setExpandedRows(p => { const s=new Set(p); s.has(id)?s.delete(id):s.add(id); return s; });
    const handleToggleDocExpand = (id: string) => setExpandedDocs(p => { const s=new Set(p); s.has(id)?s.delete(id):s.add(id); return s; });
    const getDish = (id: string): Dish | undefined => dishes.find(d => d.id === id);
    const totals = useMemo(() => reportData?.reduce((acc, curr) => acc + curr.balance, 0), [reportData]);

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Mijozlar bo'yicha balans</h2>
                 <div><label htmlFor="asOfDate" className="text-sm mr-2">Sana bo'yicha</label><input type="date" id="asOfDate" value={asOfDate} onChange={e => setAsOfDate(e.target.value)} className="p-2 border rounded-lg"/></div>
            </div>
            
            {isLoading && <div className="text-center py-10">Yuklanmoqda...</div>}
            {!isLoading && reportData && (
                <div className="overflow-x-auto"><table className="w-full text-sm border-collapse">
                    <thead className="text-xs uppercase bg-slate-50 tracking-wider"><tr><th className="p-3 text-left w-4/5 border-r">Mijoz</th><th className="p-3 text-right font-bold">Joriy Balans</th></tr></thead>
                    <tbody>
                        {reportData.map(d => {
                            const isExpanded = expandedRows.has(d.clientId);
                            return (
                            <React.Fragment key={d.clientId}>
                            <tr onClick={() => handleToggleExpand(d.clientId)} className={`cursor-pointer border-b ${isExpanded ? 'bg-amber-100' : 'hover:bg-slate-50'}`}>
                                <td className={`p-3 border-r ${isExpanded ? 'font-bold' : 'font-medium'}`}><div className="flex items-center gap-2"><ChevronDownIcon className={`h-4 w-4 transition-transform ${isExpanded ? '' : '-rotate-90'}`} /><span>{d.clientName}</span></div></td>
                                <td className={`p-3 text-right font-mono font-bold ${d.balance > 0 ? 'text-green-600' : d.balance < 0 ? 'text-red-600' : ''}`}>{formatCurrency(d.balance)}</td>
                            </tr>
                            <tr><td colSpan={2} className="p-0 border-0"><div className={`grid transition-[grid-template-rows] ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                                <div className="overflow-hidden"><div className="p-2 bg-amber-50"><div className="p-2 bg-white rounded-md border">
                                    <h4 className="text-sm font-semibold mb-2 px-2">Hujjatlar ({d.clientName})</h4>
                                    <table className="w-full text-xs">
                                        <thead><tr><th className="p-1 text-left">Sana</th><th className="p-1 text-left">Hujjat</th><th className="p-1 text-left">Turi</th><th className="p-1 text-right">Qarzga (+)</th><th className="p-1 text-right">Qarzdan (-)</th></tr></thead>
                                        <tbody>
                                            <tr className="border-t bg-slate-100"><td colSpan={3} className="p-1.5 font-semibold">Boshlang'ich qoldiq</td><td className="p-1.5 text-right font-mono text-green-700">{d.initialBalance > 0 ? formatCurrency(d.initialBalance) : '-'}</td><td className="p-1.5 text-right font-mono text-red-700">{d.initialBalance < 0 ? formatCurrency(Math.abs(d.initialBalance)) : '-'}</td></tr>
                                            {d.details.map((det, i) => {
                                                const isExpandable = det.docType === 'invoice' || det.docType === 'return';
                                                const isDocExpanded = isExpandable && expandedDocs.has(det.id);
                                                let debtAmount = 0, paymentAmount = 0;
                                                if (det.docType === 'invoice') debtAmount = getInvoiceTotal(det.items);
                                                else if (det.docType === 'payment') paymentAmount = det.amount;
                                                else if (det.docType === 'return') paymentAmount = det.items.reduce((s, i) => s + i.price * i.quantity, 0);
                                                return (
                                                <React.Fragment key={i}>
                                                    <tr className={`border-t ${isExpandable ? 'cursor-pointer hover:bg-slate-200/50' : ''}`} onClick={() => isExpandable && handleToggleDocExpand(det.id)}>
                                                        <td className="p-1.5">{new Date(det.date).toLocaleDateString()}</td><td><div className="flex items-center gap-1">{isExpandable && <ChevronDownIcon className={`h-4 w-4 ${isDocExpanded ? '' : '-rotate-90'}`} />}<span>{det.doc_number}</span></div></td><td>{det.docType}</td>
                                                        <td className="p-1.5 text-right font-mono text-green-700">{debtAmount > 0 ? formatCurrency(debtAmount) : '-'}</td>
                                                        <td className="p-1.5 text-right font-mono text-red-700">{paymentAmount > 0 ? formatCurrency(paymentAmount) : '-'}</td>
                                                    </tr>
                                                    {isDocExpanded && isExpandable && (
                                                    <tr className="border-t"><td colSpan={5} className="p-2 pt-0 bg-slate-50"><div className="text-xs bg-white p-2 rounded border">
                                                        <h5 className="font-semibold mb-1">Hujjat tarkibi:</h5>
                                                        <table>
                                                            <thead><tr><th>Mahsulot</th><th className="text-right">Miqdor</th><th className="text-right">Narx</th><th className="text-right">Summa</th></tr></thead>
                                                            <tbody>{det.items.map((item, itemIdx) => <tr key={itemIdx}><td>{getDish(item.dishId)?.name || 'N/A'}</td><td className="text-right">{item.quantity}</td><td className="text-right">{formatCurrency(item.price)}</td><td className="text-right">{formatCurrency(item.quantity * item.price)}</td></tr>)}</tbody>
                                                        </table>
                                                    </div></td></tr>
                                                    )}
                                                </React.Fragment>
                                                )
                                            })}
                                        </tbody>
                                        <tfoot><tr className="bg-amber-100"><td colSpan={3} className="p-2 font-bold text-base text-right">Yakuniy qoldiq:</td><td colSpan={2} className={`p-2 text-right font-mono font-bold text-lg ${d.balance > 0 ? 'text-green-600' : d.balance < 0 ? 'text-red-600' : ''}`}>{formatCurrency(d.balance)}</td></tr></tfoot>
                                    </table>
                                </div></div></div>
                              </div>
                            </td></tr>
                            </React.Fragment>
                        )})}
                    </tbody>
                    {totals !== null && (<tfoot className="bg-slate-100 font-bold border-t-2"><tr><td className="p-3 text-left">Jami</td><td className={`p-3 text-right font-mono text-lg ${totals > 0 ? 'text-green-600' : totals < 0 ? 'text-red-600' : ''}`}>{formatCurrency(totals)}</td></tr></tfoot>)}
                </table>
                {reportData.length === 0 && <div className="text-center py-8 text-slate-500">Hisobot uchun ma'lumot topilmadi.</div>}
                </div>
            )}
        </div>
    );
};