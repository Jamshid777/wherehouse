
import React, { useState, useMemo, useEffect } from 'react';
import { Payment, PaymentMethod } from '../types';
import { UseMockDataReturnType } from '../hooks/useMockData';
import { PlusIcon } from './icons/PlusIcon';
import { PaymentFormModal } from './forms/PaymentFormModal';

interface PaymentsViewProps {
  dataManager: UseMockDataReturnType;
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('uz-UZ').format(amount);
const formatDate = (date: Date) => date.toISOString().split('T')[0];


export const PaymentsView: React.FC<PaymentsViewProps> = ({ dataManager }) => {
  const { payments, suppliers, addPayment } = dataManager;
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    if (preset === 'today') {
        // from is already today
    } else if (preset === 'week') {
        from.setDate(to.getDate() - 7);
    } else if (preset === 'month') {
        from.setMonth(to.getMonth() - 1);
    } else if (preset === '3month') {
        from.setMonth(to.getMonth() - 3);
    }
    setFilters(prev => ({ ...prev, dateFrom: formatDate(from), dateTo: formatDate(to) }));
  };

  const filteredPayments = useMemo(() => {
    const dateFrom = new Date(filters.dateFrom);
    dateFrom.setHours(0, 0, 0, 0);
    const dateTo = new Date(filters.dateTo);
    dateTo.setHours(23, 59, 59, 999);
    
    return payments.filter(note => {
      const noteDate = new Date(note.date);
      return noteDate >= dateFrom && noteDate <= dateTo;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [payments, filters]);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleSubmit = (formData: Omit<Payment, 'id' | 'doc_number' | 'links'>) => {
    addPayment(formData);
    handleCloseModal();
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-slate-800">To'lov Hujjatlari</h2>
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
              <th scope="col" className="px-6 py-3 font-medium border-r border-slate-200">Raqam / Sana</th>
              <th scope="col" className="px-6 py-3 font-medium border-r border-slate-200">Yetkazib beruvchi</th>
              <th scope="col" className="px-6 py-3 font-medium text-right border-r border-slate-200">Summa</th>
              <th scope="col" className="px-6 py-3 font-medium border-r border-slate-200">To'lov usuli</th>
              <th scope="col" className="px-6 py-3 font-medium">Izoh</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredPayments.map(note => (
              <tr key={note.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap border-r border-slate-200">
                  <div className="font-medium text-slate-900">{note.doc_number}</div>
                  <div className="text-xs text-slate-500">{new Date(note.date).toLocaleDateString()}</div>
                </td>
                <td className="px-6 py-4 text-slate-600 border-r border-slate-200">{suppliers.find(s => s.id === note.supplier_id)?.name || 'Noma\'lum'}</td>
                <td className="px-6 py-4 text-right font-mono font-semibold text-slate-800 border-r border-slate-200">{formatCurrency(note.amount)}</td>
                <td className="px-6 py-4 text-slate-600 border-r border-slate-200">{note.payment_method}</td>
                <td className="px-6 py-4 text-slate-500 italic">{note.comment}</td>
              </tr>
            ))}
             {filteredPayments.length === 0 && (
                <tr><td colSpan={5} className="text-center py-10 text-slate-500">To'lov hujjatlari topilmadi.</td></tr>
            )}
          </tbody>
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
