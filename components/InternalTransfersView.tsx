
import React, { useState, useEffect, useMemo } from 'react';
import { InternalTransferNote, InternalTransferItem, DocumentStatus, Stock } from '../types';
import { UseMockDataReturnType } from '../hooks/useMockData';
import { Modal } from './Modal';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { TransferIcon } from './icons/TransferIcon';
import { EditIcon } from './icons/EditIcon';
import { ConfirmationModal } from './ConfirmationModal';
import { ChevronDownIcon } from './icons/ChevronDownIcon';

interface InternalTransfersViewProps {
  dataManager: UseMockDataReturnType;
  defaultWarehouseId: string | null;
}

const formatDate = (date: Date) => date.toISOString().split('T')[0];

export const InternalTransfersView: React.FC<InternalTransfersViewProps> = ({ dataManager, defaultWarehouseId }) => {
  const { internalTransfers, warehouses, products, addInternalTransfer, updateInternalTransfer, confirmInternalTransfer } = dataManager;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<InternalTransferNote | null>(null);
  const [noteToConfirm, setNoteToConfirm] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const [filters, setFilters] = useState({
    dateFrom: formatDate(new Date(new Date().setDate(new Date().getDate() - 30))),
    dateTo: formatDate(new Date()),
  });

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

  const filteredInternalTransfers = useMemo(() => {
    const dateFrom = new Date(filters.dateFrom);
    dateFrom.setHours(0, 0, 0, 0);
    const dateTo = new Date(filters.dateTo);
    dateTo.setHours(23, 59, 59, 999);
    
    return internalTransfers.filter(note => {
      const noteDate = new Date(note.date);
      return noteDate >= dateFrom && noteDate <= dateTo;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [internalTransfers, filters]);
  
  const handleOpenModal = (note: InternalTransferNote | null = null) => {
    setEditingNote(note);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingNote(null);
    setIsModalOpen(false);
  };

  const handleSubmit = (formData: Omit<InternalTransferNote, 'id' | 'status' | 'doc_number'> | InternalTransferNote) => {
    try {
        if ('id' in formData) {
            updateInternalTransfer(formData as InternalTransferNote);
        } else {
            addInternalTransfer(formData as Omit<InternalTransferNote, 'id' | 'status' | 'doc_number'>);
        }
        handleCloseModal();
    } catch (error: any) {
        alert(error.message);
    }
  };
  
  const handleConfirmClick = (id: string) => {
    setNoteToConfirm(id);
  };

  const handleConfirm = () => {
    if (!noteToConfirm) return;
    try {
        confirmInternalTransfer(noteToConfirm);
        setNoteToConfirm(null);
    } catch(error: any) {
        alert(`Xatolik: ${error.message}`);
    }
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Ichki Ko'chirish Hujjatlari</h2>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2.5 rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all shadow"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Yangi Ko'chirish</span>
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
              <th scope="col" className="px-2 py-3 w-8 border-r border-slate-200"></th>
              <th scope="col" className="px-6 py-3 border-r border-slate-200">Raqam / Sana</th>
              <th scope="col" className="px-6 py-3 border-r border-slate-200">Jo'natuvchi</th>
              <th scope="col" className="px-6 py-3 border-r border-slate-200">Qabul Qiluvchi</th>
              <th scope="col" className="px-6 py-3 border-r border-slate-200">Holati</th>
              <th scope="col" className="px-6 py-3 text-center">Amallar</th>
            </tr>
          </thead>
          <tbody>
            {filteredInternalTransfers.map(note => {
              const isExpanded = expandedRows.has(note.id);
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
                    <td className="px-6 py-4 text-slate-600 border-r border-slate-200">{warehouses.find(w => w.id === note.from_warehouse_id)?.name || 'Noma\'lum'}</td>
                    <td className="px-6 py-4 text-slate-600 border-r border-slate-200">{warehouses.find(w => w.id === note.to_warehouse_id)?.name || 'Noma\'lum'}</td>
                    <td className="px-6 py-4 border-r border-slate-200">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${note.status === DocumentStatus.CONFIRMED ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {note.status === DocumentStatus.CONFIRMED ? 'Tasdiqlangan' : 'Qoralama'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center items-center gap-2" onClick={e => e.stopPropagation()}>
                        {note.status === DocumentStatus.DRAFT ? (
                          <>
                            <button onClick={() => handleOpenModal(note)} title="Tahrirlash" className="p-2 rounded-full text-amber-600 hover:bg-amber-100 transition-colors"><EditIcon className="h-5 w-5"/></button>
                            <button onClick={() => handleConfirmClick(note.id)} className="px-3 py-1.5 bg-green-500 text-white text-xs font-semibold rounded-md hover:bg-green-600 transition-colors">Tasdiqlash</button>
                          </>
                        ) : (
                          <span className="text-xs text-slate-500">-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                   <tr>
                      <td colSpan={6} className="p-0 border-0">
                        <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                          <div className="overflow-hidden">
                            <div className="px-8 py-4 bg-slate-100">
                                <h4 className="text-sm font-semibold text-slate-700 mb-2">Hujjat tarkibi</h4>
                                {note.items.length > 0 ? (
                                    <table className="w-full text-xs bg-white rounded border-collapse">
                                        <thead className="text-slate-500 uppercase">
                                            <tr className="border-b">
                                                <th className="p-2 text-left font-medium border-r border-slate-200">Mahsulot</th>
                                                <th className="p-2 text-right font-medium">Miqdor</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                        {note.items.map((item, index) => {
                                            const product = products.find(p => p.id === item.productId);
                                            return (
                                                <tr key={index} className="border-b last:border-b-0">
                                                    <td className="p-2 border-r border-slate-200">{product?.name || 'Noma\'lum'}</td>
                                                    <td className="p-2 text-right font-mono">{item.quantity} {product?.unit}</td>
                                                </tr>
                                            );
                                        })}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p className="text-xs text-slate-500">Hujjatda mahsulotlar yo'q.</p>
                                )}
                            </div>
                          </div>
                        </div>
                      </td>
                  </tr>
                </React.Fragment>
              );
            })}
             {filteredInternalTransfers.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-slate-500">Hujjatlar topilmadi.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      
      <InternalTransferFormModal 
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


interface InternalTransferFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Omit<InternalTransferNote, 'id' | 'status' | 'doc_number'> | InternalTransferNote) => void;
    note: InternalTransferNote | null;
    dataManager: UseMockDataReturnType;
    defaultWarehouseId: string | null;
}

type FormItem = { productId: string, quantity: number, availableQty: number };

const InternalTransferFormModal: React.FC<InternalTransferFormModalProps> = ({isOpen, onClose, onSubmit, note, dataManager, defaultWarehouseId}) => {
    const { products, warehouses, stock } = dataManager;
    const [formData, setFormData] = useState({ date: new Date().toISOString().split('T')[0], from_warehouse_id: '', to_warehouse_id: '' });
    const [items, setItems] = useState<FormItem[]>([]);
    const [error, setError] = useState('');

    const productsInFromWarehouse = useMemo(() => {
        if (!formData.from_warehouse_id) return [];
        const productQuantities = new Map<string, number>();

        stock
            .filter(s => s.warehouseId === formData.from_warehouse_id)
            .forEach(s => {
                productQuantities.set(s.productId, (productQuantities.get(s.productId) || 0) + s.quantity);
            });

        if (note && note.from_warehouse_id === formData.from_warehouse_id) {
            note.items.forEach(item => {
                productQuantities.set(item.productId, (productQuantities.get(item.productId) || 0) + item.quantity);
            });
        }
        
        const uniqueProductIds = new Set(productQuantities.keys());

        return products
            .filter(p => uniqueProductIds.has(p.id))
            .map(p => ({ ...p, totalQuantity: productQuantities.get(p.id)! }));

    }, [formData.from_warehouse_id, stock, products, note]);


    useEffect(() => {
        if(isOpen) {
            if (note) {
                 setFormData({ date: new Date(note.date).toISOString().split('T')[0], from_warehouse_id: note.from_warehouse_id, to_warehouse_id: note.to_warehouse_id });
                 const updatedItems = note.items.map(item => {
                    const currentProductStock = stock
                        .filter(s => s.warehouseId === note.from_warehouse_id && s.productId === item.productId)
                        .reduce((sum, s) => sum + s.quantity, 0);
                    return { ...item, availableQty: currentProductStock + item.quantity };
                });
                setItems(updatedItems);
            } else {
                const activeWarehouses = warehouses.filter(w => w.is_active);
                const fromWarehouse = defaultWarehouseId || activeWarehouses[0]?.id || '';
                const toWarehouse = activeWarehouses.find(w => w.id !== fromWarehouse)?.id || '';
                setFormData({ date: new Date().toISOString().split('T')[0], from_warehouse_id: fromWarehouse, to_warehouse_id: toWarehouse });
                setItems([]);
            }
            setError('');
        }
    }, [isOpen, note, warehouses, defaultWarehouseId, stock]);

    useEffect(() => {
        if (formData.from_warehouse_id && formData.from_warehouse_id === formData.to_warehouse_id) {
            setError("Jo'natuvchi va qabul qiluvchi ombor bir xil bo'lishi mumkin emas.");
        } else {
            setError('');
        }
        if (!note) {
            setItems([]);
        }
    }, [formData.from_warehouse_id, formData.to_warehouse_id, note]);

    const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }

    const handleItemChange = (index: number, field: keyof FormItem, value: any) => {
        const newItems = [...items];
        const currentItem = newItems[index];

        if (field === 'productId') {
            const productInfo = productsInFromWarehouse.find(p => p.id === value);
            currentItem.productId = value;
            currentItem.availableQty = productInfo?.totalQuantity || 0;
        } else if (field === 'quantity') {
            currentItem.quantity = parseFloat(value) || 0;
        }
        
        setItems(newItems);
    }
    
    const handleAddItem = () => setItems([...items, { productId: '', quantity: 1, availableQty: 0 }]);
    const handleRemoveItem = (index: number) => setItems(items.filter((_, i) => i !== index));

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(error) return;
        const finalItems: InternalTransferItem[] = [];
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
                quantity: item.quantity
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
    
    const getProductInfo = (productId: string) => products.find(p => p.id === productId);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={note ? "Ichki ko'chirishni tahrirlash" : "Yangi ichki ko'chirish"} size="4xl" closeOnOverlayClick={false}>
            <form onSubmit={handleFormSubmit} className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-slate-700 mb-1">Sana</label>
                        <input type="date" name="date" id="date" value={formData.date} onChange={handleHeaderChange} required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg"/>
                    </div>
                    <div>
                        <label htmlFor="from_warehouse_id" className="block text-sm font-medium text-slate-700 mb-1">Jo'natuvchi ombor</label>
                        <select name="from_warehouse_id" id="from_warehouse_id" value={formData.from_warehouse_id} onChange={handleHeaderChange} required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg">
                           <option value="" disabled>Tanlang...</option>
                           {warehouses.filter(w=>w.is_active).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="to_warehouse_id" className="block text-sm font-medium text-slate-700 mb-1">Qabul qiluvchi ombor</label>
                        <select name="to_warehouse_id" id="to_warehouse_id" value={formData.to_warehouse_id} onChange={handleHeaderChange} required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg">
                           <option value="" disabled>Tanlang...</option>
                           {warehouses.filter(w=>w.is_active).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                    </div>
                </div>
                {error && <p className="text-sm text-red-600 -mt-2">{error}</p>}

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
                                                 <select value={item.productId} onChange={(e) => handleItemChange(index, 'productId', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md" disabled={!formData.from_warehouse_id}>
                                                    <option value="" disabled>Tanlang...</option>
                                                     {productsInFromWarehouse.map(p => (
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
                     <button type="button" onClick={handleAddItem} disabled={!formData.from_warehouse_id || !!error} className="mt-4 flex items-center gap-2 text-sm text-amber-600 hover:text-amber-800 font-medium disabled:text-slate-400 disabled:cursor-not-allowed">
                        <PlusIcon className="h-4 w-4"/> Qator qo'shish
                    </button>
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200">Bekor qilish</button>
                    <button type="submit" disabled={!!error} className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700 disabled:from-amber-300 disabled:to-amber-400">Saqlash</button>
                </div>
            </form>
        </Modal>
    );
}
