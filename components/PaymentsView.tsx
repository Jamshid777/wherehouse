
import React, { useState, useMemo, useEffect } from 'react';
import { Payment, PaymentMethod, GoodsReceiptNote, DocumentStatus } from '../types';
import { UseMockDataReturnType } from '../hooks/useMockData';
import { Modal } from './Modal';
import { PlusIcon } from './icons/PlusIcon';

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
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2.5 rounded-lg hover:bg-blue-600 transition-colors shadow"
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
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 tracking-wider">
            <tr>
              <th scope="col" className="px-6 py-3">Raqam / Sana</th>
              <th scope="col" className="px-6 py-3">Yetkazib beruvchi</th>
              <th scope="col" className="px-6 py-3 text-right">Summa</th>
              <th scope="col" className="px-6 py-3">To'lov usuli</th>
              <th scope="col" className="px-6 py-3">Izoh</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredPayments.map(note => (
              <tr key={note.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-slate-900">{note.doc_number}</div>
                  <div className="text-xs text-slate-500">{new Date(note.date).toLocaleDateString()}</div>
                </td>
                <td className="px-6 py-4 text-slate-600">{suppliers.find(s => s.id === note.supplier_id)?.name || 'Noma\'lum'}</td>
                <td className="px-6 py-4 text-right font-mono font-semibold text-slate-800">{formatCurrency(note.amount)}</td>
                <td className="px-6 py-4 text-slate-600">{note.payment_method}</td>
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

interface PaymentFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Omit<Payment, 'id' | 'doc_number' | 'links'>) => void;
    dataManager: UseMockDataReturnType;
}

const PaymentFormModal: React.FC<PaymentFormModalProps> = ({isOpen, onClose, onSubmit, dataManager}) => {
    const { suppliers, goodsReceipts, getNoteTotal } = dataManager;
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0], 
        supplier_id: '', 
        amount: 0, 
        payment_method: PaymentMethod.BANK,
        comment: ''
    });

    const [unpaidInvoices, setUnpaidInvoices] = useState<GoodsReceiptNote[]>([]);
    const [supplierBalance, setSupplierBalance] = useState(0);

    useEffect(() => {
        if(isOpen) {
            setFormData(prev => ({ ...prev, supplier_id: suppliers[0]?.id || '' }));
        }
    }, [isOpen, suppliers]);
    
    useEffect(() => {
        if (formData.supplier_id) {
            const supplierInvoices = goodsReceipts.filter(g => 
                g.supplier_id === formData.supplier_id && 
                g.status === DocumentStatus.CONFIRMED
            );
            const unpaid = supplierInvoices.filter(g => (getNoteTotal(g.items) - g.paid_amount) > 0.01);
            const balance = unpaid.reduce((acc, g) => acc + (getNoteTotal(g.items) - g.paid_amount), 0);
            
            setUnpaidInvoices(unpaid.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
            setSupplierBalance(balance);
        } else {
            setUnpaidInvoices([]);
            setSupplierBalance(0);
        }
    }, [formData.supplier_id, goodsReceipts, getNoteTotal]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'amount' ? parseFloat(value) || 0 : value }));
    }

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!formData.supplier_id || formData.amount <= 0) {
            alert("Iltimos, yetkazib beruvchini tanlang va to'lov summasini kiriting.");
            return;
        }
        onSubmit({ ...formData, date: new Date(formData.date).toISOString() });
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={"Yangi to'lov hujjati"} size="3xl">
            <form onSubmit={handleFormSubmit} className="space-y-6">
                {/* Header */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="supplier_id" className="block text-sm font-medium text-slate-700 mb-1">Yetkazib beruvchi</label>
                        <select name="supplier_id" id="supplier_id" value={formData.supplier_id} onChange={handleFormChange} required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg">
                           <option value="" disabled>Tanlang...</option>
                           {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-slate-700 mb-1">Sana</label>
                        <input type="date" name="date" id="date" value={formData.date} onChange={handleFormChange} required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg"/>
                    </div>
                     <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-slate-700 mb-1">To'lov summasi</label>
                        <input type="number" name="amount" id="amount" value={formData.amount} onChange={handleFormChange} required min="1" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg"/>
                    </div>
                    <div>
                        <label htmlFor="payment_method" className="block text-sm font-medium text-slate-700 mb-1">To'lov usuli</label>
                        <select name="payment_method" id="payment_method" value={formData.payment_method} onChange={handleFormChange} required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg">
                           {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                     <div className="col-span-2">
                        <label htmlFor="comment" className="block text-sm font-medium text-slate-700 mb-1">Izoh</label>
                        <textarea name="comment" id="comment" value={formData.comment} onChange={handleFormChange} rows={2} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg"></textarea>
                    </div>
                </div>

                {/* Unpaid Invoices */}
                <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-lg font-medium text-slate-800">Qoplanmagan hujjatlar (FIFO bo'yicha)</h4>
                        <div className="text-sm">
                            <span className="font-medium text-slate-600">Jami qarz: </span>
                            <span className="font-bold font-mono text-red-600">{formatCurrency(supplierBalance)} so'm</span>
                        </div>
                    </div>
                    <div className="overflow-y-auto max-h-48 border rounded-lg">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 sticky top-0">
                                <tr>
                                    <th className="px-3 py-2 text-left font-medium text-slate-600">Hujjat №</th>
                                    <th className="px-3 py-2 text-left font-medium text-slate-600">Sana</th>
                                    <th className="px-3 py-2 text-left font-medium text-slate-600">Qarz miqdori</th>
                                </tr>
                            </thead>
                            <tbody>
                                {unpaidInvoices.length > 0 ? unpaidInvoices.map((inv) => (
                                    <tr key={inv.id} className="border-b last:border-0">
                                        <td className="p-3">{inv.doc_number}</td>
                                        <td className="p-3">{new Date(inv.date).toLocaleDateString()}</td>
                                        <td className="p-3 font-mono">{formatCurrency(getNoteTotal(inv.items) - inv.paid_amount)}</td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={3} className="p-4 text-center text-slate-500">Qarz mavjud emas.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200">Bekor qilish</button>
                    <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">To'lovni saqlash</button>
                </div>
            </form>
        </Modal>
    );
}
