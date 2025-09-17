

import React, { useState, useEffect, useMemo } from 'react';
import { InventoryNote, InventoryItem, DocumentStatus, Stock } from '../types';
import { UseMockDataReturnType } from '../hooks/useMockData';
import { Modal } from './Modal';
import { PlusIcon } from './icons/PlusIcon';
import { EditIcon } from './icons/EditIcon';
import { ConfirmationModal } from './ConfirmationModal';

interface InventoryCountsViewProps {
  dataManager: UseMockDataReturnType;
  defaultWarehouseId: string | null;
}

const formatDate = (date: Date) => date.toISOString().split('T')[0];

export const InventoryCountsView: React.FC<InventoryCountsViewProps> = ({ dataManager, defaultWarehouseId }) => {
  const { inventoryNotes, warehouses, addInventoryNote, updateInventoryNote, confirmInventoryNote } = dataManager;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<InventoryNote | null>(null);
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

  const filteredInventoryNotes = useMemo(() => {
    const dateFrom = new Date(filters.dateFrom);
    dateFrom.setHours(0, 0, 0, 0);
    const dateTo = new Date(filters.dateTo);
    dateTo.setHours(23, 59, 59, 999);
    
    return inventoryNotes.filter(note => {
      const noteDate = new Date(note.date);
      return noteDate >= dateFrom && noteDate <= dateTo;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [inventoryNotes, filters]);
  
  const handleOpenModal = (note: InventoryNote | null = null) => {
    setEditingNote(note);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setEditingNote(null);
    setIsModalOpen(false);
  };

  const handleSubmit = (formData: Omit<InventoryNote, 'id' | 'status' | 'doc_number'> | InventoryNote) => {
    if ('id' in formData) {
      updateInventoryNote(formData as InventoryNote);
    } else {
      addInventoryNote(formData as Omit<InventoryNote, 'id' | 'status' | 'doc_number'>);
    }
    handleCloseModal();
  };
  
  const handleConfirmClick = (id: string) => {
    setNoteToConfirm(id);
  };

  const handleConfirm = () => {
    if (!noteToConfirm) return;
    confirmInventoryNote(noteToConfirm);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Inventarizatsiya Hujjatlari</h2>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2.5 rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all shadow"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Yangi Sanash</span>
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
              <th scope="col" className="px-6 py-3 border-r border-slate-200">Holati</th>
              <th scope="col" className="px-6 py-3 text-center">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredInventoryNotes.map(note => (
              <tr key={note.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap border-r border-slate-200">
                  <div className="font-medium text-slate-900">{note.doc_number}</div>
                  <div className="text-xs text-slate-500">{new Date(note.date).toLocaleDateString()}</div>
                </td>
                <td className="px-6 py-4 text-slate-600 border-r border-slate-200">{warehouses.find(w => w.id === note.warehouse_id)?.name || 'Noma\'lum'}</td>
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
             {filteredInventoryNotes.length === 0 && (
                <tr><td colSpan={4} className="text-center py-10 text-slate-500">Hujjatlar topilmadi.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      
      <InventoryFormModal 
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
        title="Inventarizatsiyani tasdiqlash"
        message={<>Hujjatni tasdiqlamoqchimisiz? <br/> Tizim kamomad va ortiqchalar uchun avtomatik hujjatlar yaratadi.</>}
        confirmButtonText="Ha, tasdiqlash"
      />
    </div>
  );
};


interface InventoryFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Omit<InventoryNote, 'id' | 'status' | 'doc_number'> | InventoryNote) => void;
    note: InventoryNote | null;
    dataManager: UseMockDataReturnType;
    defaultWarehouseId: string | null;
}

const InventoryFormModal: React.FC<InventoryFormModalProps> = ({isOpen, onClose, onSubmit, note, dataManager, defaultWarehouseId}) => {
    const { products, warehouses, stock, getTotalStockQuantity } = dataManager;
    const [formData, setFormData] = useState({ date: new Date().toISOString().split('T')[0], warehouse_id: '' });
    const [items, setItems] = useState<Omit<InventoryItem, 'difference'>[]>([]);

    useEffect(() => {
        if(isOpen) {
            if (note) {
                 setFormData({ date: new Date(note.date).toISOString().split('T')[0], warehouse_id: note.warehouse_id });
                 const prefilledItems = note.items.map(item => ({
                    productId: item.productId,
                    planned_quantity: item.planned_quantity,
                    real_quantity: item.real_quantity,
                }));
                setItems(prefilledItems);
            } else {
                const warehouseToSet = defaultWarehouseId || warehouses.find(w => w.is_active)?.id || '';
                setFormData({ date: new Date().toISOString().split('T')[0], warehouse_id: warehouseToSet });
                setItems([]);
            }
        }
    }, [isOpen, note, warehouses, defaultWarehouseId]);

    const handleLoadStock = () => {
        if (!formData.warehouse_id) {
            alert("Iltimos, avval omborni tanlang.");
            return;
        }
        
        const inventoryItems = products.map(p => {
            const totalQuantity = getTotalStockQuantity(p.id, formData.warehouse_id);
            return {
                productId: p.id,
                planned_quantity: totalQuantity,
                real_quantity: totalQuantity, // Default real to planned
            };
        }).filter(item => item.planned_quantity > 0); // Only show products that are in stock

        setItems(inventoryItems);
    };

    const handleItemChange = (index: number, value: string) => {
        const newItems = [...items];
        newItems[index].real_quantity = parseFloat(value) || 0;
        setItems(newItems);
    }

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalItems: InventoryItem[] = items.map(item => ({
            ...item,
            difference: item.real_quantity - item.planned_quantity,
        }));
        
        if (finalItems.length === 0) {
            alert("Iltimos, avval 'Qoldiqlarni yuklash' tugmasini bosing.");
            return;
        }

        const dataToSubmit = { ...formData, date: new Date(formData.date).toISOString(), items: finalItems };
        if (note) {
            onSubmit({ ...note, ...dataToSubmit });
        } else {
            onSubmit(dataToSubmit);
        }
    }
    
    const getProductInfo = (productId: string) => products.find(p => p.id === productId);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={note ? "Inventarizatsiyani tahrirlash" : "Yangi inventarizatsiya"} size="5xl" closeOnOverlayClick={false}>
            <form onSubmit={handleFormSubmit} className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-slate-700 mb-1">Sana</label>
                        <input type="date" name="date" id="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg"/>
                    </div>
                    <div>
                        <label htmlFor="warehouse_id" className="block text-sm font-medium text-slate-700 mb-1">Ombor</label>
                        <select name="warehouse_id" id="warehouse_id" value={formData.warehouse_id} onChange={e => setFormData({...formData, warehouse_id: e.target.value})} required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg">
                           <option value="" disabled>Tanlang...</option>
                           {warehouses.filter(w=>w.is_active).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <button type="button" onClick={handleLoadStock} className="w-full px-4 py-2.5 bg-slate-600 text-white rounded-lg hover:bg-slate-700">Qoldiqlarni yuklash</button>
                     </div>
                </div>

                <div className="border-t pt-4">
                    <h4 className="text-lg font-medium text-slate-800 mb-3">Mahsulotlar ro'yxati</h4>
                    <div className="overflow-x-auto max-h-[50vh]">
                        <table className="w-full text-sm border-collapse">
                            <thead className="bg-slate-50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2 text-left font-medium text-slate-600 w-2/5 border-r border-slate-200">Mahsulot</th>
                                    <th className="px-4 py-2 text-left font-medium text-slate-600 border-r border-slate-200">Rejadagi (tizim)</th>
                                    <th className="px-4 py-2 text-left font-medium text-slate-600 border-r border-slate-200">Haqiqiy (sanoq)</th>
                                    <th className="px-4 py-2 text-left font-medium text-slate-600">Farq</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, index) => {
                                    const product = getProductInfo(item.productId);
                                    const difference = item.real_quantity - item.planned_quantity;
                                    return (
                                        <tr key={index} className="border-b">
                                            <td className="p-2 font-medium border-r border-slate-200">{product?.name}</td>
                                            <td className="p-2 border-r border-slate-200">{item.planned_quantity} {product?.unit}</td>
                                            <td className="p-2 border-r border-slate-200">
                                                <input type="number" value={item.real_quantity} onChange={(e) => handleItemChange(index, e.target.value)} min="0" step="0.01" className="w-full px-3 py-2 border border-slate-300 rounded-md"/>
                                            </td>
                                            <td className={`p-2 font-bold ${difference > 0 ? 'text-green-600' : difference < 0 ? 'text-red-600' : 'text-slate-500'}`}>
                                                {difference.toFixed(2)}
                                            </td>
                                        </tr>
                                    )
                                })}
                                {items.length === 0 && (
                                    <tr><td colSpan={4} className="text-center py-10 text-slate-400">Omborni tanlab, qoldiqlarni yuklang.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200">Bekor qilish</button>
                    <button type="submit" className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700">Saqlash</button>
                </div>
            </form>
        </Modal>
    );
}