import React, { useState, useEffect, useMemo } from 'react';
import { SalesReturnNote, SalesReturnItem, SalesReturnReason, Client, Warehouse, SalesInvoice, DocumentStatus } from '../../types';
import { UseMockDataReturnType } from '../../hooks/useMockData';
import { Modal } from '../Modal';
import { PlusIcon } from '../icons/PlusIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { SearchableSelect } from '../SearchableSelect';

interface SalesReturnFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<SalesReturnNote, 'id' | 'status' | 'doc_number'>) => void;
  note: SalesReturnNote | null;
  dataManager: UseMockDataReturnType;
  defaultWarehouseId: string | null;
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('uz-UZ').format(amount);
const formatDate = (date: Date) => date.toISOString().split('T')[0];

export const SalesReturnFormModal: React.FC<SalesReturnFormModalProps> = ({ isOpen, onClose, onSubmit, note, dataManager, defaultWarehouseId }) => {
  const { clients, warehouses, dishes, salesInvoices } = dataManager;

  const [formData, setFormData] = useState({
    date: formatDate(new Date()),
    client_id: '',
    warehouse_id: '',
    reason: '' as SalesReturnReason,
  });
  const [items, setItems] = useState<SalesReturnItem[]>([]);

  const dishOptions = useMemo(() => dishes.map(d => ({ value: d.id, label: `${d.name}`})), [dishes]);
  
  useEffect(() => {
    if (!isOpen) return;

    if (note) {
      setFormData({
        date: formatDate(new Date(note.date)),
        client_id: note.client_id,
        warehouse_id: note.warehouse_id,
        reason: note.reason,
      });
      setItems(note.items.map(item => ({ ...item })));
    } else {
      const warehouseToSet = defaultWarehouseId || warehouses.find(w => w.is_active)?.id;
      setFormData({
        date: formatDate(new Date()),
        client_id: clients.find(c => c.is_active)?.id || '',
        warehouse_id: warehouseToSet || '',
        reason: '' as SalesReturnReason,
      });
      setItems([]);
    }
  }, [isOpen, note, defaultWarehouseId, warehouses, clients]);

  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index: number, field: keyof SalesReturnItem, value: any) => {
    setItems(prevItems => {
      const newItems = [...prevItems];
      if (!newItems[index]) return prevItems;

      if (field === 'dishId') {
        const dish = dishes.find(d => d.id === value);
        
        // Find last price for this client and dish
        const lastSale = salesInvoices
            .filter(inv => inv.client_id === formData.client_id && inv.status === DocumentStatus.CONFIRMED)
            .flatMap(inv => inv.items.map(i => ({...i, date: inv.date})))
            .filter(i => i.dishId === value)
            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

        newItems[index].dishId = value;
        newItems[index].price = lastSale?.price || dish?.price || 0;
        newItems[index].cost = lastSale?.cost || 0;

      } else {
        (newItems[index] as any)[field] = parseFloat(value) || 0;
      }
      return newItems;
    });
  };

  const handleAddItem = () => {
    setItems(prev => [...prev, { dishId: '', quantity: 1, price: 0, cost: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };
  
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.reason) {
        alert("Iltimos, qaytarish sababini tanlang.");
        return;
    }
    const finalItems = items.filter(item => item.dishId && item.quantity > 0);
    if (finalItems.length === 0) {
      alert("Iltimos, qaytarish uchun kamida bitta mahsulot qo'shing.");
      return;
    }

    onSubmit({ ...formData, date: new Date(formData.date).toISOString(), items: finalItems });
  };

  const totalAmount = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={note ? "Sotuvdan qaytarishni tahrirlash" : "Yangi sotuvdan qaytarish hujjati"} size="fullscreen" closeOnOverlayClick={false}>
      <form onSubmit={handleFormSubmit} className="flex flex-col h-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-4 border-b flex-shrink-0">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Sana</label><input type="date" name="date" value={formData.date} onChange={handleHeaderChange} required className="w-full px-3 py-2.5 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Mijoz</label><select name="client_id" value={formData.client_id} onChange={handleHeaderChange} required className="w-full px-3 py-2.5 border rounded-lg bg-white"><option value="" disabled>Tanlang...</option>{clients.filter(c => c.is_active).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Ombor</label><select name="warehouse_id" value={formData.warehouse_id} onChange={handleHeaderChange} required className="w-full px-3 py-2.5 border rounded-lg bg-white"><option value="" disabled>Tanlang...</option>{warehouses.filter(w => w.is_active).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select></div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Qaytarish sababi</label>
                <select name="reason" value={formData.reason} onChange={handleHeaderChange} required className="w-full px-3 py-2.5 border rounded-lg bg-white">
                    <option value="" disabled>Sababni tanlang...</option>
                    {Object.values(SalesReturnReason).map(r => <option key={r} value={r}>{r}</option>)}
                </select>
            </div>
        </div>

        <div className="flex-1 py-4">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-slate-50"><tr><th className="p-2 text-left w-2/5">Tayyor mahsulot</th><th className="p-2 text-left">Miqdor</th><th className="p-2 text-left">Narx</th><th className="p-2 text-left">Summa</th><th className="p-2"></th></tr></thead>
            <tbody>
              {items.map((item, index) => {
                const dishLabel = item.dishId ? `${dishOptions.find(d => d.value === item.dishId)?.label}` : 'Tayyor mahsulotni qidiring...';
                
                return (
                  <tr key={index} className="border-b">
                    <td className="p-1"><SearchableSelect options={dishOptions} value={item.dishId} onChange={(val) => handleItemChange(index, 'dishId', val || '')} placeholder={dishLabel} /></td>
                    <td className="p-1"><input type="number" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} min="1" step="any" className="w-full p-2 border rounded-md" /></td>
                    <td className="p-1"><input type="number" value={item.price} onChange={e => handleItemChange(index, 'price', e.target.value)} min="0" step="any" className="w-full p-2 border rounded-md" /></td>
                    <td className="p-1 font-mono">{formatCurrency(item.quantity * item.price)}</td>
                    <td className="p-1 text-center"><button type="button" onClick={() => handleRemoveItem(index)} className="p-2 text-red-500 hover:text-red-700"><TrashIcon className="h-5 w-5"/></button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <button type="button" onClick={handleAddItem} className="mt-4 flex items-center gap-2 text-sm text-amber-600 font-medium"><PlusIcon className="h-4 w-4"/> Qator qo'shish</button>
        </div>
        
        <div className="flex-shrink-0 pt-4 border-t">
            <div className="flex justify-end items-center gap-6">
                <div className="text-right"><span className="text-sm">Jami summa: </span><span className="text-xl font-bold font-mono">{formatCurrency(totalAmount)}</span></div>
                <div className="flex items-center gap-3">
                     <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 rounded-lg">Bekor qilish</button>
                    <button type="submit" className="px-4 py-2 bg-amber-500 text-white rounded-lg">Saqlash</button>
                </div>
            </div>
        </div>
      </form>
    </Modal>
  );
};