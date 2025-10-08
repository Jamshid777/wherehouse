import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SalesInvoice, SalesInvoiceItem, PaymentMethod, Client, Warehouse, Dish, Recipe } from '../../types';
import { UseMockDataReturnType } from '../../hooks/useMockData';
import { Modal } from '../Modal';
import { PlusIcon } from '../icons/PlusIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { SearchableSelect } from '../SearchableSelect';
import { EditIcon } from '../icons/EditIcon';
import { ClientFormModal } from './ClientFormModal';
import { WarehouseFormModal } from './WarehouseFormModal';
import { DishFormModal } from './DishFormModal';

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

const formatNumberWithSpaces = (num: number): string => {
    if (num === null || num === undefined) return '';
    const parts = num.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return parts.join('.');
};

export const SalesInvoiceFormModal: React.FC<SalesInvoiceFormModalProps> = ({ isOpen, onClose, onSubmit, note, dataManager, defaultWarehouseId }) => {
  const { clients, warehouses, dishes, getTotalStockQuantity, stock, addClient, updateClient, addWarehouse, updateWarehouse, addDish, updateDish } = dataManager;

  const [formData, setFormData] = useState({
    date: formatDate(new Date()),
    client_id: '',
    warehouse_id: '',
    paid_amount: 0,
    payment_method: PaymentMethod.CASH,
  });
  const [items, setItems] = useState<SalesInvoiceItem[]>([]);
  const [clientModalState, setClientModalState] = useState<{isOpen: boolean, client: Client | null}>({isOpen: false, client: null});
  const [warehouseModalState, setWarehouseModalState] = useState<{isOpen: boolean, warehouse: Warehouse | null}>({isOpen: false, warehouse: null});
  const [dishModalState, setDishModalState] = useState<{isOpen: boolean, dish: Dish | null, index: number | null}>({isOpen: false, dish: null, index: null});
  const firstDishInputRef = useRef<HTMLInputElement>(null);

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
      setItems([{ dishId: '', quantity: 0, price: 0, cost: 0 }]);
      setTimeout(() => {
        firstDishInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, note, defaultWarehouseId, warehouses, clients]);

  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'paid_amount' ? parseFloat(value.replace(/\s/g, '')) || 0 : value }));
  };

  const handleItemChange = (index: number, field: keyof SalesInvoiceItem, value: any) => {
    setItems(prevItems => {
      const newItems = [...prevItems];
      if (!newItems[index]) return prevItems;
      const currentItem = newItems[index];

      if (field === 'dishId') {
        const dish = dishes.find(d => d.id === value);
        currentItem.dishId = value;
        currentItem.price = dish?.price || 0;
        
        if (value && index === prevItems.length - 1) {
            newItems.push({ dishId: '', quantity: 0, price: 0, cost: 0 });
        }
      } else {
        (currentItem as any)[field] = parseFloat(String(value).replace(/\s/g, '')) || 0;
      }
      return newItems;
    });
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

  const handleClientFormSubmit = (clientData: Omit<Client, 'id'> | Client) => {
    if ('id' in clientData) {
        updateClient(clientData);
    } else {
        const newClient = addClient(clientData);
        setFormData(prev => ({...prev, client_id: newClient.id}));
    }
    setClientModalState({isOpen: false, client: null});
  };

  const handleWarehouseFormSubmit = (warehouseData: Omit<Warehouse, 'id'> | Warehouse) => {
      if ('id' in warehouseData) {
          updateWarehouse(warehouseData);
      } else {
          const newWarehouse = addWarehouse(warehouseData);
          setFormData(prev => ({...prev, warehouse_id: newWarehouse.id}));
      }
      setWarehouseModalState({isOpen: false, warehouse: null});
  };

  const handleDishFormSubmit = (dishData: Omit<Dish, 'id'>, recipeData: Omit<Recipe, 'dishId'>) => {
      if (dishModalState.dish) { // Editing
          updateDish({ ...dishData, id: dishModalState.dish.id }, recipeData);
      } else { // Adding new
          const newDish = addDish(dishData, recipeData);
          if (dishModalState.index !== null) {
              handleItemChange(dishModalState.index, 'dishId', newDish.id);
          }
      }
      setDishModalState({isOpen: false, dish: null, index: null});
  };

  const handleEditDishClick = (index: number) => {
      const item = items[index];
      if (!item.dishId) return;
      const dishToEdit = dishes.find(d => d.id === item.dishId);
      if (dishToEdit) {
          setDishModalState({ isOpen: true, dish: dishToEdit, index });
      }
  };

  return (
    <>
    <Modal isOpen={isOpen} onClose={onClose} title={note ? "Sotuv hujjatini tahrirlash" : "Yangi sotuv hujjati"} size="fullscreen" closeOnOverlayClick={false}>
      <form onSubmit={(e) => handleFormSubmit(e, 'save')} className="flex flex-col h-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b border-slate-200 flex-shrink-0">
            <div><label htmlFor="date" className="block text-sm font-medium text-slate-700 mb-1">Sana</label><input type="date" id="date" name="date" value={formData.date} onChange={handleHeaderChange} required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg" /></div>
            <div className="flex items-end gap-1">
                <div className="flex-grow">
                    <label htmlFor="client_id" className="block text-sm font-medium text-slate-700 mb-1">Mijoz</label>
                    <select name="client_id" id="client_id" value={formData.client_id} onChange={handleHeaderChange} required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg">
                        <option value="" disabled>Tanlang...</option>
                        {clients.filter(c => c.is_active).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <button type="button" onClick={() => setClientModalState({ isOpen: true, client: null })} title="Yangi qo'shish" className="p-2.5 bg-slate-200 rounded-lg hover:bg-slate-300 transition-colors"><PlusIcon className="h-5 w-5"/></button>
                <button 
                  type="button" 
                  onClick={() => {
                    const clientToEdit = clients.find(c => c.id === formData.client_id);
                    if (clientToEdit) {
                        setClientModalState({ isOpen: true, client: clientToEdit });
                    }
                  }} 
                  disabled={!formData.client_id}
                  title="Tahrirlash"
                  className="p-2.5 bg-slate-200 rounded-lg hover:bg-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    <EditIcon className="h-5 w-5"/>
                </button>
            </div>
            <div className="flex items-end gap-1">
                <div className="flex-grow">
                    <label htmlFor="warehouse_id" className="block text-sm font-medium text-slate-700 mb-1">Ombor</label>
                    <select name="warehouse_id" id="warehouse_id" value={formData.warehouse_id} onChange={handleHeaderChange} required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg">
                        <option value="" disabled>Tanlang...</option>
                        {warehouses.filter(w => w.is_active).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                </div>
                <button type="button" onClick={() => setWarehouseModalState({ isOpen: true, warehouse: null })} title="Yangi qo'shish" className="p-2.5 bg-slate-200 rounded-lg hover:bg-slate-300 transition-colors"><PlusIcon className="h-5 w-5"/></button>
                <button 
                  type="button" 
                  onClick={() => {
                    const warehouseToEdit = warehouses.find(w => w.id === formData.warehouse_id);
                    if (warehouseToEdit) {
                        setWarehouseModalState({ isOpen: true, warehouse: warehouseToEdit });
                    }
                  }} 
                  disabled={!formData.warehouse_id}
                  title="Tahrirlash"
                  className="p-2.5 bg-slate-200 rounded-lg hover:bg-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    <EditIcon className="h-5 w-5"/>
                </button>
            </div>
        </div>

        <div className="flex-1 py-4">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-slate-50"><tr><th className="p-2 text-left font-medium text-slate-600" style={{width: '50%'}}>Tayyor mahsulot (Qoldiq)</th><th className="p-2 text-left font-medium text-slate-600">Miqdor</th><th className="p-2 text-left font-medium text-slate-600">Narx</th><th className="p-2 text-left font-medium text-slate-600">Summa</th><th className="p-2"></th></tr></thead>
            <tbody>
              {items.map((item, index) => {
                const availableQty = availableQuantities.get(item.dishId) || 0;
                const originalQty = note?.items.find(i => i.dishId === item.dishId && note.warehouse_id === formData.warehouse_id)?.quantity || 0;
                const maxQty = availableQty + originalQty;
                
                return (
                  <tr key={index} className="border-b">
                    <td className="p-1">
                      <div className="flex items-center gap-1">
                          <div className="flex-grow">
                              <SearchableSelect
                                  ref={index === 0 ? firstDishInputRef : undefined}
                                  options={dishOptions.map(opt => ({...opt, label: `${opt.label} (Qoldiq: ${availableQuantities.get(opt.value)?.toFixed(2) || '0.00'})`}))}
                                  value={item.dishId}
                                  onChange={(value) => handleItemChange(index, 'dishId', value || '')}
                                  onAddNew={() => setDishModalState({ isOpen: true, dish: null, index })}
                                  placeholder="Mahsulotni qidiring..."
                                  addNewLabel="... Yangi mahsulot qo'shish"
                              />
                          </div>
                          <button 
                              type="button" 
                              onClick={() => handleEditDishClick(index)} 
                              disabled={!item.dishId}
                              title="Tahrirlash"
                              className="p-2 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                              <EditIcon className="h-5 w-5"/>
                          </button>
                      </div>
                    </td>
                    <td className="p-1"><input type="text" value={item.quantity === 0 ? '' : formatNumberWithSpaces(item.quantity)} onChange={e => { const cleanedValue = e.target.value.replace(/\s/g, ''); if (/^\d*\.?\d*$/.test(cleanedValue) || cleanedValue === '') { handleItemChange(index, 'quantity', cleanedValue); } }} placeholder="0" className="w-full p-2 border rounded-md text-right" required title={`Mavjud: ${maxQty}`} /></td>
                    <td className="p-1"><input type="text" value={item.price === 0 ? '' : formatNumberWithSpaces(item.price)} onChange={e => { const cleanedValue = e.target.value.replace(/\s/g, ''); if (/^\d*\.?\d*$/.test(cleanedValue) || cleanedValue === '') { handleItemChange(index, 'price', cleanedValue); } }} placeholder="0" className="w-full p-2 border rounded-md text-right" required /></td>
                    <td className="p-1 font-mono text-right">{formatCurrency(item.quantity * item.price)}</td>
                    <td className="p-1 text-center"><button type="button" onClick={() => handleRemoveItem(index)} className="p-2 text-red-500 hover:text-red-700"><TrashIcon className="h-5 w-5"/></button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        
        <div className="flex-shrink-0 pt-4 border-t border-slate-200">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                        <label htmlFor="paid_amount" className="text-sm font-medium text-slate-700">Oldindan to'lov:</label>
                        <input
                            type="text"
                            id="paid_amount"
                            name="paid_amount"
                            value={formData.paid_amount === 0 ? '' : formatNumberWithSpaces(formData.paid_amount)}
                            onChange={e => { const cleanedValue = e.target.value.replace(/\s/g, ''); if (/^\d*\.?\d*$/.test(cleanedValue) || cleanedValue === '') { handleHeaderChange({ target: { name: 'paid_amount', value: cleanedValue } } as React.ChangeEvent<HTMLInputElement>); } }}
                            placeholder="0"
                            className="w-40 px-3 py-2 border border-slate-300 rounded-md text-right"
                        />
                    </div>
                    {formData.paid_amount > 0 && (<div className="flex items-center gap-2"><label htmlFor="payment_method" className="text-sm font-medium text-slate-700">To'lov usuli:</label><select name="payment_method" id="payment_method" value={formData.payment_method} onChange={handleHeaderChange} className="w-40 px-3 py-2 border border-slate-300 rounded-md bg-white">{Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}</select></div>)}
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-right"><span className="text-sm text-slate-600">Jami summa: </span><span className="text-xl font-bold text-slate-800 font-mono">{formatCurrency(totalAmount)}</span></div>
                    <div className="flex items-center gap-3">
                         <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200">Bekor qilish</button>
                        <button type="submit" className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700">Saqlash</button>
                        <button type="button" onClick={(e) => handleFormSubmit(e, 'save_and_confirm')} className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700">Saqlash va Tasdiqlash</button>
                    </div>
                </div>
            </div>
        </div>
      </form>
    </Modal>
    
    <ClientFormModal isOpen={clientModalState.isOpen} onClose={() => setClientModalState({isOpen: false, client: null})} onSubmit={handleClientFormSubmit} client={clientModalState.client} />
    <WarehouseFormModal isOpen={warehouseModalState.isOpen} onClose={() => setWarehouseModalState({isOpen: false, warehouse: null})} onSubmit={handleWarehouseFormSubmit} warehouse={warehouseModalState.warehouse} />
    <DishFormModal isOpen={dishModalState.isOpen} onClose={() => setDishModalState({isOpen: false, dish: null, index: null})} onSubmit={handleDishFormSubmit} dish={dishModalState.dish} dataManager={dataManager} />
    </>
  );
};