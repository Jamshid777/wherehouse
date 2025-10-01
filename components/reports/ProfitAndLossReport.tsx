import React, { useState, useMemo } from 'react';
import { UseMockDataReturnType } from '../../hooks/useMockData';
import { SalesInvoice, DocumentStatus } from '../../types';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';

const formatCurrency = (amount: number) => new Intl.NumberFormat('uz-UZ').format(amount);
const formatDate = (date: Date) => date.toISOString().split('T')[0];

interface ProfitAndLossReportProps {
  dataManager: UseMockDataReturnType;
}

export const ProfitAndLossReport: React.FC<ProfitAndLossReportProps> = ({ dataManager }) => {
  const { salesInvoices, clients, dishes, expenses, expenseCategories } = dataManager;
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
  const [filters, setFilters] = useState({
    dateFrom: formatDate(new Date(new Date().setDate(new Date().getDate() - 30))),
    dateTo: formatDate(new Date()),
  });

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const reportData = useMemo(() => {
    const dateFrom = new Date(filters.dateFrom);
    dateFrom.setHours(0, 0, 0, 0);
    const dateTo = new Date(filters.dateTo);
    dateTo.setHours(23, 59, 59, 999);
    
    const filteredInvoices = salesInvoices.filter(note => {
      const noteDate = new Date(note.date);
      return note.status === DocumentStatus.CONFIRMED && noteDate >= dateFrom && noteDate <= dateTo;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const filteredExpenses = expenses.filter(exp => {
      const expDate = new Date(exp.date);
      return expDate >= dateFrom && expDate <= dateTo;
    });

    const expensesByCategory = new Map<string, { categoryName: string, amount: number }>();
    expenseCategories.forEach(cat => {
        expensesByCategory.set(cat.id, { categoryName: cat.name, amount: 0 });
    });

    let totalExpenses = 0;
    filteredExpenses.forEach(exp => {
        const entry = expensesByCategory.get(exp.categoryId);
        if (entry) {
            entry.amount += exp.amount;
        }
        totalExpenses += exp.amount;
    });
    
    return {
        invoices: filteredInvoices,
        expenses: Array.from(expensesByCategory.values()).filter(e => e.amount > 0),
        totalExpenses
    };
  }, [salesInvoices, expenses, expenseCategories, filters]);

  const handleToggleExpand = (id: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const calculateTotals = (invoice: SalesInvoice) => {
    const totalRevenue = invoice.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalCost = invoice.items.reduce((sum, item) => sum + item.cost * item.quantity, 0);
    const totalProfit = totalRevenue - totalCost;
    return { totalRevenue, totalCost, totalProfit };
  };

  const grandTotals = useMemo(() => {
    let totalRevenue = 0;
    let totalCost = 0;

    reportData.invoices.forEach(invoice => {
        const totals = calculateTotals(invoice);
        totalRevenue += totals.totalRevenue;
        totalCost += totals.totalCost;
    });
    const grossProfit = totalRevenue - totalCost;
    const netProfit = grossProfit - reportData.totalExpenses;

    return { totalRevenue, totalCost, grossProfit, netProfit, totalExpenses: reportData.totalExpenses };
  }, [reportData]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-2xl font-bold text-slate-800 mb-4">Foyda va Zarar Hisoboti</h2>
      
      <div className="flex flex-wrap items-end gap-4 p-4 border rounded-lg bg-slate-50 mb-6">
        <div>
            <label htmlFor="dateFrom" className="block text-sm font-medium text-slate-700 mb-1">Sana (dan)</label>
            <input type="date" name="dateFrom" value={filters.dateFrom} onChange={handleFilterChange} className="px-3 py-2.5 border border-slate-300 rounded-lg text-sm" />
        </div>
        <div>
            <label htmlFor="dateTo" className="block text-sm font-medium text-slate-700 mb-1">Sana (gacha)</label>
            <input type="date" name="dateTo" value={filters.dateTo} onChange={handleFilterChange} className="px-3 py-2.5 border border-slate-300 rounded-lg text-sm" />
        </div>
        <div className="flex items-center gap-2 self-end">
            <button type="button" onClick={() => handleDatePreset('today')} className="px-3 py-2 text-sm bg-slate-200 rounded-md hover:bg-slate-300 transition-colors">Bugun</button>
            <button type="button" onClick={() => handleDatePreset('week')} className="px-3 py-2 text-sm bg-slate-200 rounded-md hover:bg-slate-300 transition-colors">Hafta</button>
            <button type="button" onClick={() => handleDatePreset('month')} className="px-3 py-2 text-sm bg-slate-200 rounded-md hover:bg-slate-300 transition-colors">Oy</button>
            <button type="button" onClick={() => handleDatePreset('3month')} className="px-3 py-2 text-sm bg-slate-200 rounded-md hover:bg-slate-300 transition-colors">3 Oy</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <h3 className="text-lg font-semibold text-slate-700 mb-2">Sotuvlar</h3>
        <table className="w-full text-sm text-left border-collapse">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 tracking-wider">
            <tr>
              <th scope="col" className="px-2 py-3 w-8 border-r"></th>
              <th scope="col" className="px-6 py-3 border-r">Sana / Raqam</th>
              <th scope="col" className="px-6 py-3 border-r">Mijoz</th>
              <th scope="col" className="px-6 py-3 text-right border-r">Sotuv Summasi</th>
              <th scope="col" className="px-6 py-3 text-right border-r">Tannarx</th>
              <th scope="col" className="px-6 py-3 text-right border-r">Yalpi Foyda</th>
            </tr>
          </thead>
          <tbody>
            {reportData.invoices.map(note => {
              const isExpanded = expandedRows.has(note.id);
              const { totalRevenue, totalCost, totalProfit } = calculateTotals(note);
              
              return (
              <React.Fragment key={note.id}>
                <tr onClick={() => handleToggleExpand(note.id)} className={`${isExpanded ? 'bg-amber-50' : 'hover:bg-slate-50'} cursor-pointer border-b`}>
                    <td className="px-2 py-4 text-center border-r"><ChevronDownIcon className={`h-5 w-5 text-slate-400 transition-transform ${isExpanded ? '' : '-rotate-90'}`} /></td>
                    <td className="px-6 py-4 whitespace-nowrap border-r"><div className="font-medium">{note.doc_number}</div><div className="text-xs text-slate-500">{new Date(note.date).toLocaleDateString()}</div></td>
                    <td className="px-6 py-4 text-slate-600 border-r">{clients.find(c => c.id === note.client_id)?.name || 'Noma\'lum'}</td>
                    <td className="px-6 py-4 text-right font-mono border-r">{formatCurrency(totalRevenue)}</td>
                    <td className="px-6 py-4 text-right font-mono border-r">{formatCurrency(totalCost)}</td>
                    <td className={`px-6 py-4 text-right font-mono font-bold border-r ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(totalProfit)}</td>
                </tr>
                <tr>
                  <td colSpan={6} className="p-0 border-0">
                    <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                      <div className="overflow-hidden"><div className="p-4 bg-amber-50">
                        <h4 className="text-sm font-semibold text-slate-700 mb-2">Hujjat tarkibi</h4>
                        <table className="w-full text-xs bg-white rounded">
                            <thead className="bg-slate-100"><tr className="border-b"><th className="p-2 text-left">Taom</th><th className="p-2 text-right">Miqdor</th><th className="p-2 text-right">Sotuv Narxi</th><th className="p-2 text-right">Sotuv Summasi</th><th className="p-2 text-right">Tannarx</th><th className="p-2 text-right">Jami Tannarx</th><th className="p-2 text-right">Foyda</th></tr></thead>
                            <tbody>
                                {note.items.map((item, index) => {
                                    const revenue = item.price * item.quantity;
                                    const cost = item.cost * item.quantity;
                                    const profit = revenue - cost;
                                    return (
                                        <tr key={index} className="border-b last:border-b-0">
                                            <td className="p-2">{dishes.find(d => d.id === item.dishId)?.name || 'Noma\'lum'}</td>
                                            <td className="p-2 text-right font-mono">{item.quantity}</td>
                                            <td className="p-2 text-right font-mono">{formatCurrency(item.price)}</td>
                                            <td className="p-2 text-right font-mono">{formatCurrency(revenue)}</td>
                                            <td className="p-2 text-right font-mono">{formatCurrency(item.cost)}</td>
                                            <td className="p-2 text-right font-mono">{formatCurrency(cost)}</td>
                                            <td className={`p-2 text-right font-mono font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(profit)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                      </div></div>
                    </div>
                  </td>
                </tr>
              </React.Fragment>
            )})}
            {reportData.invoices.length === 0 && (<tr><td colSpan={6} className="text-center py-10 text-slate-500">Sotuv hujjatlari topilmadi.</td></tr>)}
          </tbody>
        </table>
      </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">Operatsion Harajatlar</h3>
                <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50"><tr><th className="px-4 py-2 text-left">Kategoriya</th><th className="px-4 py-2 text-right">Summa</th></tr></thead>
                        <tbody>
                            {reportData.expenses.map((exp, i) => (
                                <tr key={i} className="border-b"><td className="px-4 py-2">{exp.categoryName}</td><td className="px-4 py-2 text-right font-mono">{formatCurrency(exp.amount)}</td></tr>
                            ))}
                             {reportData.expenses.length === 0 && (<tr><td colSpan={2} className="text-center py-6 text-slate-400">Harajatlar kiritilmagan.</td></tr>)}
                        </tbody>
                        <tfoot className="bg-slate-100 font-semibold"><tr className="border-t-2"><td className="px-4 py-2 text-right">Jami harajatlar:</td><td className="px-4 py-2 text-right font-mono">{formatCurrency(grandTotals.totalExpenses)}</td></tr></tfoot>
                    </table>
                </div>
            </div>
            <div className="p-6 bg-amber-50 rounded-xl">
                 <h3 className="text-lg font-semibold text-slate-700 mb-4">Moliyaviy Natija</h3>
                 <div className="space-y-3 text-lg">
                    <div className="flex justify-between items-center"><span className="text-slate-600">Jami Sotuv:</span><span className="font-mono font-semibold text-slate-800">{formatCurrency(grandTotals.totalRevenue)}</span></div>
                    <div className="flex justify-between items-center"><span className="text-slate-600">Jami Tannarx:</span><span className="font-mono font-semibold text-slate-800">{formatCurrency(grandTotals.totalCost)}</span></div>
                    <hr/>
                    <div className="flex justify-between items-center text-xl"><span className="font-bold text-slate-700">Yalpi Foyda (Sotuvdan):</span><span className={`font-mono font-bold ${grandTotals.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(grandTotals.grossProfit)}</span></div>
                    <div className="flex justify-between items-center"><span className="text-slate-600">Jami Harajatlar:</span><span className="font-mono font-semibold text-red-600">- {formatCurrency(grandTotals.totalExpenses)}</span></div>
                    <hr/>
                    <div className="flex justify-between items-center text-2xl pt-2 border-t-2 border-amber-200"><span className="font-extrabold text-slate-800">Sof Foyda:</span><span className={`font-mono font-extrabold ${grandTotals.netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatCurrency(grandTotals.netProfit)}</span></div>
                 </div>
            </div>
        </div>
    </div>
  );
};