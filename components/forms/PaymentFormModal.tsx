import React, { useState, useEffect } from 'react';
import { Payment, PaymentMethod, GoodsReceiptNote, DocumentStatus } from '../../types';
import { UseMockDataReturnType } from '../../hooks/useMockData';
import { Modal } from '../Modal';

const formatCurrency = (amount: number) => new Intl.NumberFormat('uz-UZ').format(amount);

export interface PaymentFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Omit<Payment, 'id' | 'doc_number' | 'links'>) => void;
    dataManager: UseMockDataReturnType;
}

export const PaymentFormModal: React.FC<PaymentFormModalProps> = ({isOpen, onClose, onSubmit, dataManager}) => {
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
            setFormData({
                date: new Date().toISOString().split('T')[0], 
                supplier_id: suppliers.filter(s => s.id !== 'SYSTEM')[0]?.id || '', 
                amount: 0, 
                payment_method: PaymentMethod.BANK,
                comment: ''
            });
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
        <Modal isOpen={isOpen} onClose={onClose} title={"Yangi to'lov hujjati"} size="3xl" closeOnOverlayClick={false}>
            <form onSubmit={handleFormSubmit} className="space-y-6">
                {/* Header */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="supplier_id" className="block text-sm font-medium text-slate-700 mb-1">Yetkazib beruvchi</label>
                        <select name="supplier_id" id="supplier_id" value={formData.supplier_id} onChange={handleFormChange} required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg">
                           <option value="" disabled>Tanlang...</option>
                           {suppliers.filter(s => s.id !== 'SYSTEM').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
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
                        <table className="w-full text-sm border-collapse">
                            <thead className="bg-slate-50 sticky top-0">
                                <tr>
                                    <th className="px-3 py-2 text-left font-medium text-slate-600 border-r border-slate-200">Hujjat №</th>
                                    <th className="px-3 py-2 text-left font-medium text-slate-600 border-r border-slate-200">Sana</th>
                                    <th className="px-3 py-2 text-left font-medium text-slate-600">Qarz miqdori</th>
                                </tr>
                            </thead>
                            <tbody>
                                {unpaidInvoices.length > 0 ? unpaidInvoices.map((inv) => (
                                    <tr key={inv.id} className="border-b last:border-0">
                                        <td className="p-3 border-r border-slate-200">{inv.doc_number}</td>
                                        <td className="p-3 border-r border-slate-200">{new Date(inv.date).toLocaleDateString()}</td>
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
                    <button type="submit" className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700">To'lovni saqlash</button>
                </div>
            </form>
        </Modal>
    );
}