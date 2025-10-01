import React, { useState, useEffect, useMemo } from 'react';
import { SalesInvoice, SalesInvoiceItem, PaymentMethod, Client, Warehouse } from '../../types';
import { UseMockDataReturnType } from '../../hooks/useMockData';
import { Modal } from '../Modal';
import { PlusIcon } from '../icons/PlusIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { SearchableSelect } from '../SearchableSelect';

interface SalesInvoiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<SalesInvoice, 'id' | 'status' | 'doc_number'>, action: 'save' | 'save_and_confirm') => void;
  note: SalesInvoice | null;
  dataManager: UseMockDataReturnType;
  defaultWarehouseId: string | null;
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('uz-UZ').format(amount);
const formatDate = (date: Date) => date.toISOString().split('T')[0];

export const SalesInvoiceFormModal: React.FC<SalesInvoiceFormModalProps> = ({ isOpen, onClose, onSubmit, note, dataManager, defaultWarehouseId }) => {
  const { clients, warehouses, dishes, getTotalStockQuantity, stock } = dataManager;

  const [formData, setFormData] = useState({
    date: formatDate(new Date()),
    client_id: '',
    warehouse_id: '',
    paid_amount: 0,
    payment_method: PaymentMethod.CASH,
  });
  const [items, setItems] = useState<SalesInvoiceItem[]>([]);

  const dishOptions = useMemo(() => dishes.map(d => ({ value: d.id, label: `${d.name} (${formatCurrency(d.price)} so'm)`})), [dishes]);
  
  const availableQuantities = useMemo(() => {
    const map = new Map<string, number>();
    if (formData.warehouse_id) {
        dishes.forEach(dish => {
            const dishStock = getTotalStockQuantity({ dishId: dish.id }, formData.warehouse_id);
            map.set(dish.id, dishStock);
        });
    }
    return map;
  }, [dishes, formData.warehouse_id, getTotalStockQuantity, stock]);

  useEffect(() => {
    if (!isOpen) return;

    if (note) {
      setFormData({
        date: formatDate(new Date(note.date)),
        client_id: note.client_id,
        warehouse_id: note.warehouse_id,
        paid_amount: note.paid_amount,
        payment_method: note.payment_method || PaymentMethod.CASH,
      });
      setItems(note.items.map(item => ({ ...item })));
    } else {
      const warehouseToSet = defaultWarehouseId || warehouses.find(w => w.is_active)?.id;
      setFormData({
        date: formatDate(new Date()),
        client_id: clients.find(c => c.is_active)?.id || '',
        warehouse_id: warehouseToSet || '',
        paid_amount: 0,
        payment_method: PaymentMethod.CASH,
      });
      setItems([]);
    }
  }, [isOpen, note, defaultWarehouseId, warehouses, clients]);

  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'paid_amount' ? parseFloat(value) || 0 : value }));
  };

  const handleItemChange = (index: number, field: keyof SalesInvoiceItem, value: any) => {
    setItems(prevItems => {
      const newItems = [...prevItems];
      if (!newItems[index]) return prevItems;

      if (field === 'dishId') {
        const dish = dishes.find(d => d.id === value);
        newItems[index].dishId = value;
        newItems[index].price = dish?.price || 0;
      } else {
        (newItems[index] as any)[field] = parseFloat(value) || 0;
      }
      return newItems;
    });
  };

  const handleAddItem = () => {
    if (!formData.warehouse_id) {
        alert("Iltimos, avval omborni tanlang.");
        return;
    }
    setItems(prev => [...prev, { dishId: '', quantity: 1, price: 0, cost: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };
  
  const handleFormSubmit = (e: React.FormEvent, action: 'save' | 'save_and_confirm') => {
    e.preventDefault();
    const finalItems = items.filter(item => item.dishId && item.quantity > 0);
    if (finalItems.length === 0) {
      alert("Iltimos, sotish uchun kamida bitta tayyor mahsulot qo'shing.");
      return;
    }

    for (const item of finalItems) {
        const originalQuantity = note?.items.find(i => i.dishId === item.dishId)?.quantity || 0;
        const availableInStock = availableQuantities.get(item.dishId) || 0;
        const maxQty = availableInStock + (note?.warehouse_id === formData.warehouse_id ? originalQuantity : 0);
        
        if (item.quantity > maxQty) {
            const dishName = dishes.find(d => d.id === item.dishId)?.name;
            alert(`Xatolik: "${dishName}" uchun omborda yetarli mahsulot yo'q. Faqat ${maxQty} dona mavjud.`);
            return;
        }
    }

    onSubmit({ ...formData, date: new Date(formData.date).toISOString(), items: finalItems }, action);
  };

  const totalAmount = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={note ? "Sotuv hujjatini tahrirlash" : "Yangi sotuv hujjati"} size="fullscreen" closeOnOverlayClick={false}>
      <form onSubmit={(e) => handleFormSubmit(e, 'save')} className="flex flex-col h-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b flex-shrink-0">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Sana</label><input type="date" name="date" value={formData.date} onChange={handleHeaderChange} required className="w-full px-3 py-2.5 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Mijoz</label><select name="client_id" value={formData.client_id} onChange={handleHeaderChange} required className="w-full px-3 py-2.5 border rounded-lg bg-white"><option value="" disabled>Tanlang...</option>{clients.filter(c => c.is_active).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Ombor</label><select name="warehouse_id" value={formData.warehouse_id} onChange={handleHeaderChange} required className="w-full px-3 py-2.5 border rounded-lg bg-white"><option value="" disabled>Tanlang...</option>{warehouses.filter(w => w.is_active).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select></div>
        </div>

        <div className="flex-1 py-4">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-slate-50"><tr><th className="p-2 text-left w-2/5">Tayyor mahsulot (Qoldiq)</th><th className="p-2 text-left">Miqdor</th><th className="p-2 text-left">Narx</th><th className="p-2 text-left">Summa</th><th className="p-2"></th></tr></thead>
            <tbody>
              {items.map((item, index) => {
                const availableQty = availableQuantities.get(item.dishId) || 0;
                const originalQty = note?.items.find(i => i.dishId === item.dishId && note.warehouse_id === formData.warehouse_id)?.quantity || 0;
                const maxQty = availableQty + originalQty;
                const dishLabel = item.dishId ? `${dishOptions.find(d => d.value === item.dishId)?.label}` : 'Tayyor mahsulotni qidiring...';
                
                return (
                  <tr key={index} className="border-b">
                    <td className="p-1"><SearchableSelect options={dishOptions.map(opt => ({...opt, label: `${opt.label} (Qoldiq: ${availableQuantities.get(opt.value)?.toFixed(2) || 0})`}))} value={item.dishId} onChange={(val) => handleItemChange(index, 'dishId', val || '')} placeholder={dishLabel} /></td>
                    <td className="p-1"><input type="number" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} min="1" max={maxQty} step="any" className="w-full p-2 border rounded-md" title={`Mavjud: ${maxQty}`} /></td>
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
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2"><label className="text-sm font-medium">Oldindan to'lov:</label><input type="number" name="paid_amount" value={formData.paid_amount} onChange={handleHeaderChange} min="0" className="w-40 p-2 border rounded-md"/></div>
                    {formData.paid_amount > 0 && (<div className="flex items-center gap-2"><label className="text-sm font-medium">To'lov usuli:</label><select name="payment_method" value={formData.payment_method} onChange={handleHeaderChange} className="w-40 p-2 border rounded-md bg-white">{Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}</select></div>)}
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-right"><span className="text-sm">Jami summa: </span><span className="text-xl font-bold font-mono">{formatCurrency(totalAmount)}</span></div>
                    <div className="flex items-center gap-3">
                         <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 rounded-lg">Bekor qilish</button>
                        <button type="submit" className="px-4 py-2 bg-amber-500 text-white rounded-lg">Saqlash</button>
                        <button type="button" onClick={(e) => handleFormSubmit(e, 'save_and_confirm')} className="px-4 py-2 bg-green-500 text-white rounded-lg">Saqlash va Tasdiqlash</button>
                    </div>
                </div>
            </div>
        </div>
      </form>
    </Modal>
  );
};