import React, { useState, useMemo } from 'react';
import { PriceAdjustmentNote, DocumentStatus, Product } from '../types';
import { UseMockDataReturnType } from '../hooks/useMockData';
import { ChevronDownIcon } from './icons/ChevronDownIcon';

interface PriceAdjustmentsViewProps {
  dataManager: UseMockDataReturnType;
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('uz-UZ').format(amount);
const formatDate = (date: Date) => date.toISOString().split('T')[0];

export const PriceAdjustmentsView: React.FC<PriceAdjustmentsViewProps> = ({ dataManager }) => {
  const { priceAdjustments, warehouses, suppliers, products, goodsReceipts } = dataManager;
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
    if (preset === 'today') { /* from is already today */ } 
    else if (preset === 'week') { from.setDate(to.getDate() - 7); } 
    else if (preset === 'month') { from.setMonth(to.getMonth() - 1); } 
    else if (preset === '3month') { from.setMonth(to.getMonth() - 3); }
    setFilters(prev => ({ ...prev, dateFrom: formatDate(from), dateTo: formatDate(to) }));
  };

  const filteredNotes = useMemo(() => {
    const dateFrom = new Date(filters.dateFrom);
    dateFrom.setHours(0, 0, 0, 0);
    const dateTo = new Date(filters.dateTo);
    dateTo.setHours(23, 59, 59, 999);
    
    return priceAdjustments.filter(note => {
      const noteDate = new Date(note.date);
      return noteDate >= dateFrom && noteDate <= dateTo;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [priceAdjustments, filters]);


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
  
  const getNoteTotal = (items: PriceAdjustmentNote['items']) => items.reduce((sum, item) => sum + (item.newPrice - item.oldPrice) * item.originalQuantity, 0);
  const getGrnDocNumber = (id: string) => goodsReceipts.find(g => g.id === id)?.doc_number || 'N/A';

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Narxni Korrektirovka Qilish Hujjatlari</h2>
      </div>

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
        <table className="w-full text-sm text-left border-collapse">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 tracking-wider">
            <tr>
              <th scope="col" className="px-2 py-3 w-8 border-r border-slate-200"></th>
              <th scope="col" className="px-6 py-3 border-r border-slate-200">Raqam / Sana</th>
              <th scope="col" className="px-6 py-3 border-r border-slate-200">Asos Hujjat</th>
              <th scope="col" className="px-6 py-3 border-r border-slate-200">Ta'minotchi</th>
              <th scope="col" className="px-6 py-3 text-right border-r border-slate-200">Summa</th>
              <th scope="col" className="px-6 py-3 border-r border-slate-200">Holati</th>
            </tr>
          </thead>
          <tbody>
            {filteredNotes.map(note => {
              const isExpanded = expandedRows.has(note.id);
              const total = getNoteTotal(note.items);
              return (
              <React.Fragment key={note.id}>
                <tr onClick={() => handleToggleExpand(note.id)} className={`${isExpanded ? 'bg-slate-100' : 'hover:bg-slate-50'} cursor-pointer border-b border-slate-200`}>
                  <td className="px-2 py-4 text-center border-r border-slate-200">
                      <ChevronDownIcon className={`h-5 w-5 text-slate-400 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap border-r border-slate-200">
                    <div className="font-medium text-slate-900">{note.doc_number}</div>
                    <div className="text-xs text-slate-500">{new Date(note.date).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 border-r border-slate-200">{getGrnDocNumber(note.goodsReceiptNoteId)}</td>
                  <td className="px-6 py-4 text-slate-600 border-r border-slate-200">{suppliers.find(s => s.id === note.supplier_id)?.name || 'Noma\'lum'}</td>
                  <td className={`px-6 py-4 text-right font-mono border-r border-slate-200 ${total > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {total >= 0 ? '+' : ''}{formatCurrency(total)}
                  </td>
                  <td className="px-6 py-4 border-r border-slate-200">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${note.status === DocumentStatus.CONFIRMED ? 'bg-amber-100 text-amber-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {note.status === DocumentStatus.CONFIRMED ? 'Tasdiqlangan' : 'Qoralama'}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td colSpan={6} className="p-0 border-0">
                    <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                      <div className="overflow-hidden">
                        <div className="px-8 py-4 bg-slate-100">
                            <h4 className="text-sm font-semibold text-slate-700 mb-2">Hujjat tarkibi</h4>
                            <table className="w-full text-xs bg-white rounded border-collapse">
                                <thead>
                                    <tr className="border-b">
                                        <th className="p-2 text-left font-medium border-r">Mahsulot</th>
                                        <th className="p-2 text-right font-medium border-r">Eski narx</th>
                                        <th className="p-2 text-right font-medium border-r">Yangi narx</th>
                                        <th className="p-2 text-right font-medium border-r">Farq</th>
                                        <th className="p-2 text-right font-medium">Summa</th>
                                    </tr>
                                </thead>
                                <tbody>
                                {note.items.map((item, index) => {
                                    const product = products.find(p => p.id === item.productId);
                                    const priceDiff = item.newPrice - item.oldPrice;
                                    const amountDiff = priceDiff * item.originalQuantity;
                                    return (
                                        <tr key={index} className="border-b last:border-b-0">
                                            <td className="p-2 border-r">{product?.name || 'Noma\'lum'}</td>
                                            <td className="p-2 text-right font-mono border-r">{formatCurrency(item.oldPrice)}</td>
                                            <td className="p-2 text-right font-mono border-r">{formatCurrency(item.newPrice)}</td>
                                            <td className={`p-2 text-right font-mono border-r ${priceDiff > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(priceDiff)}</td>
                                            <td className={`p-2 text-right font-mono ${amountDiff > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(amountDiff)}</td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                                <tfoot className="bg-slate-50 font-semibold">
                                    <tr>
                                        <td colSpan={4} className="p-2 text-right border-r">Jami:</td>
                                        <td className={`p-2 text-right font-mono ${total > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(total)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </React.Fragment>
            )})}
             {filteredNotes.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-slate-500">Hujjatlar topilmadi.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
