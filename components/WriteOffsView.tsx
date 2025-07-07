
import React, { useState, useEffect, useMemo } from 'react';
import { WriteOffNote, WriteOffItem, DocumentStatus, WriteOffReason, Stock, Product } from '../types';
import { UseMockDataReturnType } from '../hooks/useMockData';
import { Modal } from './Modal';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { EditIcon } from './icons/EditIcon';
import { ConfirmationModal } from './ConfirmationModal';

interface WriteOffsViewProps {
  dataManager: UseMockDataReturnType;
  defaultWarehouseId: string | null;
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('uz-UZ').format(amount);
const formatDate = (date: Date) => date.toISOString().split('T')[0];

export const WriteOffsView: React.FC<WriteOffsViewProps> = ({ dataManager, defaultWarehouseId }) => {
  const { writeOffs, warehouses, addWriteOff, updateWriteOff, confirmWriteOff } = dataManager;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<WriteOffNote | null>(null);
  const [noteToConfirm, setNoteToConfirm] = useState<string | null>(null);
  
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

  const filteredWriteOffs = useMemo(() => {
    const dateFrom = new Date(filters.dateFrom);
    dateFrom.setHours(0, 0, 0, 0);
    const dateTo = new Date(filters.dateTo);
    dateTo.setHours(23, 59, 59, 999);
    
    return writeOffs.filter(note => {
      const noteDate = new Date(note.date);
      return noteDate >= dateFrom && noteDate <= dateTo;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [writeOffs, filters]);


  const handleOpenModal = (note: WriteOffNote | null = null) => {
    setEditingNote(note);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingNote(null);
  };

  const handleSubmit = (formData: Omit<WriteOffNote, 'id' | 'status' | 'doc_number'> | WriteOffNote) => {
    try {
        if ('id' in formData) {
            updateWriteOff(formData);
        } else {
            addWriteOff(formData as Omit<WriteOffNote, 'id' | 'status' | 'doc_number'>);
        }
        handleCloseModal();
    } catch (error: any) {
        alert(`Xatolik: ${error.message}`);
    }
  };
  
  const handleConfirmClick = (id: string) => {
    setNoteToConfirm(id);
  };

  const handleConfirm = () => {
    if (!noteToConfirm) return;
    try {
      confirmWriteOff(noteToConfirm);
    } catch (error: any) {
      alert(`Xatolik: ${error.message}`);
    }
  };
  
  const getNoteTotal = (items: WriteOffItem[]) => items.reduce((sum, item) => sum + item.cost * item.quantity, 0);

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Chiqim Hujjatlari</h2>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2.5 rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all shadow"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Yangi Chiqim</span>
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
              <th scope="col" className="px-6 py-3 border-r border-slate-200">Raqam / Sana</th>
              <th scope="col" className="px-6 py-3 border-r border-slate-200">Ombor</th>
              <th scope="col" className="px-6 py-3 border-r border-slate-200">Sababi</th>
              <th scope="col" className="px-6 py-3 text-right border-r border-slate-200">Summa</th>
              <th scope="col" className="px-6 py-3 border-r border-slate-200">Holati</th>
              <th scope="col" className="px-6 py-3 text-center">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredWriteOffs.map(note => (
              <tr key={note.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap border-r border-slate-200">
                  <div className="font-medium text-slate-900">{note.doc_number}</div>
                  <div className="text-xs text-slate-500">{new Date(note.date).toLocaleDateString()}</div>
                </td>
                <td className="px-6 py-4 text-slate-600 border-r border-slate-200">{warehouses.find(w => w.id === note.warehouse_id)?.name || 'Noma\'lum'}</td>
                <td className="px-6 py-4 text-slate-600 border-r border-slate-200">{note.reason}</td>
                <td className="px-6 py-4 text-right font-mono border-r border-slate-200">{formatCurrency(getNoteTotal(note.items))}</td>
                <td className="px-6 py-4 border-r border-slate-200">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${note.status === DocumentStatus.CONFIRMED ? 'bg-amber-100 text-amber-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {note.status === DocumentStatus.CONFIRMED ? 'Tasdiqlangan' : 'Qoralama'}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  {note.status === DocumentStatus.DRAFT && (
                    <div className="flex justify-center items-center gap-2">
                      <button onClick={() => handleOpenModal(note)} title="Tahrirlash" className="p-2 rounded-full text-amber-600 hover:bg-amber-100 transition-colors"><EditIcon className="h-5 w-5"/></button>
                      <button onClick={() => handleConfirmClick(note.id)} className="px-3 py-1.5 bg-green-500 text-white text-xs font-semibold rounded-md hover:bg-green-600 transition-colors">Tasdiqlash</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
             {filteredWriteOffs.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-slate-500">Hujjatlar topilmadi.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      
      <WriteOffFormModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        note={editingNote}
        dataManager={dataManager}
        defaultWarehouseId={defaultWarehouseId}
      />
      <ConfirmationModal
        isOpen={!!noteToConfirm}
        onClose={() => setNoteToConfirm(null)}
        onConfirm={handleConfirm}
        title="Hujjatni tasdiqlash"
        message={<>Hujjatni tasdiqlamoqchimisiz? <br/> Tasdiqlangan hujjatni o'zgartirib bo'lmaydi va zaxiralar yangilanadi.</>}
        confirmButtonText="Ha, tasdiqlash"
      />
    </div>
  );
};


interface WriteOffFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Omit<WriteOffNote, 'id' | 'status' | 'doc_number'> | WriteOffNote) => void;
    note: WriteOffNote | null;
    dataManager: UseMockDataReturnType;
    defaultWarehouseId: string | null;
}

type FormItem = { productId: string, quantity: number, availableQty: number, cost: number };

const WriteOffFormModal: React.FC<WriteOffFormModalProps> = ({isOpen, onClose, onSubmit, note, dataManager, defaultWarehouseId}) => {
    const { products, warehouses, stock } = dataManager;
    const [formData, setFormData] = useState({ date: new Date().toISOString().split('T')[0], warehouse_id: '', reason: WriteOffReason.SPOILAGE });
    const [items, setItems] = useState<FormItem[]>([]);

    const productsInStock = useMemo(() => {
        if (!formData.warehouse_id) return [];
        const productQuantities = new Map<string, number>();

        stock
            .filter(s => s.warehouseId === formData.warehouse_id)
            .forEach(s => {
                productQuantities.set(s.productId, (productQuantities.get(s.productId) || 0) + s.quantity);
            });

        if (note && note.warehouse_id === formData.warehouse_id) {
            note.items.forEach(item => {
                productQuantities.set(item.productId, (productQuantities.get(item.productId) || 0) + item.quantity);
            });
        }
        
        const uniqueProductIds = new Set(productQuantities.keys());

        return products
            .filter(p => uniqueProductIds.has(p.id))
            .map(p => ({ ...p, totalQuantity: productQuantities.get(p.id)! }));
    }, [formData.warehouse_id, stock, products, note]);

    useEffect(() => {
        if(isOpen) {
            if (note) {
                setFormData({ date: new Date(note.date).toISOString().split('T')[0], warehouse_id: note.warehouse_id, reason: note.reason });
                const updatedItems = note.items.map(item => {
                    const currentProductStock = stock
                        .filter(s => s.warehouseId === note.warehouse_id && s.productId === item.productId)
                        .reduce((sum, s) => sum + s.quantity, 0);
                    return { ...item, availableQty: currentProductStock + item.quantity };
                });
                setItems(updatedItems);
            } else {
                const warehouseToSet = defaultWarehouseId || warehouses.find(w => w.is_active)?.id || '';
                setFormData({ date: new Date().toISOString().split('T')[0], warehouse_id: warehouseToSet, reason: WriteOffReason.SPOILAGE });
                setItems([]);
            }
        }
    }, [isOpen, note, warehouses, defaultWarehouseId, stock]);

    useEffect(() => {
        if (!note) {
            setItems([]);
        }
    }, [formData.warehouse_id, note]);

    const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }

    const handleItemChange = (index: number, field: keyof FormItem, value: any) => {
        const newItems = [...items];
        const currentItem = newItems[index];

        if (field === 'productId') {
            const productInfo = productsInStock.find(p => p.id === value);
            currentItem.productId = value;
            currentItem.availableQty = productInfo?.totalQuantity || 0;
            currentItem.cost = 0; // Cost will be calculated upon confirmation by FIFO
        } else if (field === 'quantity') {
            currentItem.quantity = parseFloat(value) || 0;
        }
        
        setItems(newItems);
    }
    
    const handleAddItem = () => {
        setItems([...items, { productId: '', quantity: 1, availableQty: 0, cost: 0 }]);
    }

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    }

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalItems: WriteOffItem[] = [];
        for (const item of items) {
            if (!item.productId || item.quantity <= 0) {
                 alert("Iltimos, har bir qatorda mahsulotni tanlab, miqdorni to'g'ri kiriting.");
                 return;
            }
            if (item.quantity > item.availableQty) {
                const productName = products.find(p=>p.id === item.productId)?.name;
                alert(`Xatolik: "${productName}" mahsuloti uchun miqdor qoldiqdan ko'p kiritildi.`);
                return;
            }
            finalItems.push({
                productId: item.productId,
                quantity: item.quantity,
                cost: item.cost
            });
        }

        if (finalItems.length === 0) {
            alert("Iltimos, kamida bitta mahsulot kiriting.");
            return;
        }

        const dataToSubmit = { ...formData, date: new Date(formData.date).toISOString(), items: finalItems };
        if (note) {
            onSubmit({ ...note, ...dataToSubmit });
        } else {
            onSubmit(dataToSubmit);
        }
    }
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={note ? "Chiqim hujjatini tahrirlash" : "Yangi chiqim hujjati"} size="4xl">
            <form onSubmit={handleFormSubmit} className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-slate-700 mb-1">Sana</label>
                        <input type="date" name="date" id="date" value={formData.date} onChange={handleHeaderChange} required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg"/>
                    </div>
                    <div>
                        <label htmlFor="warehouse_id" className="block text-sm font-medium text-slate-700 mb-1">Ombor</label>
                        <select name="warehouse_id" id="warehouse_id" value={formData.warehouse_id} onChange={handleHeaderChange} required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg">
                           <option value="" disabled>Tanlang...</option>
                           {warehouses.filter(w=>w.is_active).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="reason" className="block text-sm font-medium text-slate-700 mb-1">Chiqim sababi</label>
                        <select name="reason" id="reason" value={formData.reason} onChange={handleHeaderChange} required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg">
                           {Object.values(WriteOffReason).filter(r => r !== WriteOffReason.INVENTORY_SHORTAGE).map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                </div>

                <div className="border-t pt-4">
                    <h4 className="text-lg font-medium text-slate-800 mb-3">Mahsulotlar</h4>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-2 py-2 text-left font-medium text-slate-600 border-r border-slate-200" style={{width: '60%'}}>Mahsulot (Qoldiq)</th>
                                    <th className="px-2 py-2 text-left font-medium text-slate-600 border-r border-slate-200">Miqdor</th>
                                    <th className="px-2 py-2"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, index) => {
                                    return (
                                        <tr key={index} className="border-b">
                                            <td className="p-1 border-r border-slate-200">
                                                 <select value={item.productId} onChange={(e) => handleItemChange(index, 'productId', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md" disabled={!formData.warehouse_id}>
                                                    <option value="" disabled>Tanlang...</option>
                                                    {productsInStock.map(p => (
                                                        <option key={p.id} value={p.id}>
                                                            {p.name} ({p.totalQuantity.toFixed(2)} {p.unit})
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="p-1 border-r border-slate-200">
                                                <input type="number" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} max={item.availableQty} min="0.01" step="0.01" className="w-full px-3 py-2 border border-slate-300 rounded-md" required disabled={!item.productId}/>
                                            </td>
                                            <td className="p-1 text-center">
                                                <button type="button" onClick={() => handleRemoveItem(index)} className="text-red-500 hover:text-red-700"><TrashIcon className="h-5 w-5"/></button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                     <button type="button" onClick={handleAddItem} disabled={!formData.warehouse_id} className="mt-4 flex items-center gap-2 text-sm text-amber-600 hover:text-amber-800 font-medium disabled:text-slate-400 disabled:cursor-not-allowed">
                        <PlusIcon className="h-4 w-4"/> Qator qo'shish
                    </button>
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200">Bekor qilish</button>
                    <button type="submit" className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700">Saqlash</button>
                </div>
            </form>
        </Modal>
    );
}
