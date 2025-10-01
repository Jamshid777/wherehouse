
import React, { useState, useEffect, useMemo } from 'react';
import { GoodsReturnNote, GoodsReturnItem, DocumentStatus, Stock, Product, GoodsReceiptNote } from '../types';
import { UseMockDataReturnType } from '../hooks/useMockData';
import { Modal } from './Modal';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { EditIcon } from './icons/EditIcon';
import { ConfirmationModal } from './ConfirmationModal';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { FifoBreakdownModal } from './FifoBreakdownModal';

interface GoodsReturnsViewProps {
  dataManager: UseMockDataReturnType;
  defaultWarehouseId: string | null;
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('uz-UZ').format(amount);
const formatDate = (date: Date) => date.toISOString().split('T')[0];

export const GoodsReturnsView: React.FC<GoodsReturnsViewProps> = ({ dataManager, defaultWarehouseId }) => {
  const { goodsReturns, warehouses, suppliers, products, addGoodsReturn, updateGoodsReturn, confirmGoodsReturn } = dataManager;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<GoodsReturnNote | null>(null);
  const [noteToConfirm, setNoteToConfirm] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [breakdownModalData, setBreakdownModalData] = useState<{item: GoodsReturnItem, product: Product | undefined} | null>(null);
  
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

  const filteredGoodsReturns = useMemo(() => {
    const dateFrom = new Date(filters.dateFrom);
    dateFrom.setHours(0, 0, 0, 0);
    const dateTo = new Date(filters.dateTo);
    dateTo.setHours(23, 59, 59, 999);
    
    return goodsReturns.filter(note => {
      const noteDate = new Date(note.date);
      return noteDate >= dateFrom && noteDate <= dateTo;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [goodsReturns, filters]);


  const handleOpenModal = (note: GoodsReturnNote | null = null) => {
    setEditingNote(note);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setEditingNote(null);
    setIsModalOpen(false);
  };

  const handleSubmit = (formData: Omit<GoodsReturnNote, 'id' | 'status' | 'doc_number'> | GoodsReturnNote) => {
    try {
        if ('id' in formData) {
            updateGoodsReturn(formData);
        } else {
            addGoodsReturn(formData as Omit<GoodsReturnNote, 'id' | 'status' | 'doc_number'>);
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
      confirmGoodsReturn(noteToConfirm);
      setNoteToConfirm(null);
    } catch (error: any) {
      alert(`Xatolik: ${error.message}`);
    }
  };

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
  
  const getNoteTotal = (items: GoodsReturnItem[]) => items.reduce((sum, item) => sum + item.cost * item.quantity, 0);

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Ta'minotchiga Qaytarish</h2>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2.5 rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all shadow"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Yangi Qaytarish</span>
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
              <th scope="col" className="px-6 py-3 border-r border-slate-200">Ta'minotchi</th>
              <th scope="col" className="px-6 py-3 border-r border-slate-200">Ombor</th>
              <th scope="col" className="px-6 py-3 text-right border-r border-slate-200">Summa</th>
              <th scope="col" className="px-6 py-3 border-r border-slate-200">Holati</th>
              <th scope="col" className="px-6 py-3 text-center">Amallar</th>
            </tr>
          </thead>
          <tbody>
            {filteredGoodsReturns.map(note => {
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
                  <td className="px-6 py-4 text-slate-600 border-r border-slate-200">{suppliers.find(s => s.id === note.supplier_id)?.name || 'Noma\'lum'}</td>
                  <td className="px-6 py-4 text-slate-600 border-r border-slate-200">{warehouses.find(w => w.id === note.warehouse_id)?.name || 'Noma\'lum'}</td>
                  <td className="px-6 py-4 text-right font-mono border-r border-slate-200">{note.status === DocumentStatus.CONFIRMED ? formatCurrency(getNoteTotal(note.items)) : '-'}</td>
                  <td className="px-6 py-4 border-r border-slate-200">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${note.status === DocumentStatus.CONFIRMED ? 'bg-amber-100 text-amber-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {note.status === DocumentStatus.CONFIRMED ? 'Tasdiqlangan' : 'Qoralama'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {note.status === DocumentStatus.DRAFT ? (
                      <div className="flex justify-center items-center gap-2">
                          <button onClick={(e) => { e.stopPropagation(); handleOpenModal(note); }} title="Tahrirlash" className="p-2 rounded-full text-amber-600 hover:bg-amber-100 transition-colors"><EditIcon className="h-5 w-5"/></button>
                          <button onClick={(e) => { e.stopPropagation(); handleConfirmClick(note.id); }} className="px-3 py-1.5 bg-green-500 text-white text-xs font-semibold rounded-md hover:bg-green-600 transition-colors">Tasdiqlash</button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">-</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td colSpan={7} className="p-0 border-0">
                    <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                      <div className="overflow-hidden">
                        <div className="px-8 py-4 bg-slate-100">
                            <h4 className="text-sm font-semibold text-slate-700 mb-2">Hujjat tarkibi</h4>
                            {note.items.length > 0 ? (
                                <table className="w-full text-xs bg-white rounded border-collapse">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="p-2 text-left font-medium border-r border-slate-200">Mahsulot</th>
                                            <th className="p-2 text-right font-medium border-r border-slate-200">Miqdor</th>
                                            <th className="p-2 text-right font-medium border-r border-slate-200">Narx (FIFO)</th>
                                            <th className="p-2 text-right font-medium">Summa</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                    {note.items.map((item, index) => {
                                        const product = products.find(p => p.id === item.productId);
                                        return (
                                            <tr key={index} className="border-b last:border-b-0">
                                                <td className="p-2 border-r border-slate-200">{product?.name || 'Noma\'lum'}</td>
                                                <td className="p-2 text-right font-mono border-r border-slate-200">{item.quantity.toFixed(2)} {product?.unit}</td>
                                                <td className="p-2 text-right font-mono border-r border-slate-200">
                                                    {note.status === DocumentStatus.CONFIRMED ? (
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); setBreakdownModalData({ item, product }); }}
                                                            disabled={!item.consumedBatches}
                                                            className="underline decoration-dotted hover:text-amber-600 disabled:no-underline disabled:text-inherit disabled:cursor-default"
                                                            title="Tannarx shakllanishini ko'rish"
                                                        >
                                                            {formatCurrency(item.cost)}
                                                        </button>
                                                    ) : '-'}
                                                </td>
                                                <td className="p-2 text-right font-mono">{note.status === DocumentStatus.CONFIRMED ? formatCurrency(item.cost * item.quantity) : '-'}</td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                     <tfoot className="bg-slate-50 font-semibold">
                                        <tr>
                                            <td colSpan={3} className="p-2 text-right border-r border-slate-200">Jami:</td>
                                            <td className="p-2 text-right font-mono">{note.status === DocumentStatus.CONFIRMED ? formatCurrency(getNoteTotal(note.items)) : '-'}</td>
                                        </tr>
                                    </tfoot>
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
            )})}
             {filteredGoodsReturns.length === 0 && (
                <tr><td colSpan={7} className="text-center py-10 text-slate-500">Hujjatlar topilmadi.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      
      <GoodsReturnFormModal 
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
        title="Qaytarish hujjatini tasdiqlash"
        message={<>Hujjatni tasdiqlamoqchimisiz? <br/> Tasdiqlangan hujjatni o'zgartirib bo'lmaydi va qoldiqlar kamaytiriladi.</>}
        confirmButtonText="Ha, tasdiqlash"
      />
      <FifoBreakdownModal
        isOpen={!!breakdownModalData}
        onClose={() => setBreakdownModalData(null)}
        item={breakdownModalData?.item || null}
        product={breakdownModalData?.product || null}
        title={`${breakdownModalData?.product?.name || ''} Tannarxining Shakllanishi`}
      />
    </div>
  );
};

// ===================================================================
// =================== PRODUCT SELECTOR MODAL ========================
// ===================================================================
interface SelectableProduct {
    product: Product;
    batch: Stock;
}

interface SelectProductsForReturnModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddItems: (items: { productId: string, quantity: number }[]) => void;
    supplierId: string;
    warehouseId: string;
    dataManager: UseMockDataReturnType;
}

const SelectProductsForReturnModal: React.FC<SelectProductsForReturnModalProps> = ({ isOpen, onClose, onAddItems, supplierId, warehouseId, dataManager }) => {
    const { stock, products, goodsReceipts } = dataManager;
    const [returnQuantities, setReturnQuantities] = useState<Map<string, number>>(new Map());

    const selectableProducts = useMemo<SelectableProduct[]>(() => {
        if (!supplierId || !warehouseId) return [];

        const supplierReceiptIds = new Set(
            goodsReceipts.filter(g => g.supplier_id === supplierId).map(g => g.id)
        );

        return stock
            .filter(s => {
                if (s.warehouseId !== warehouseId || s.quantity <= 0) return false;
                const grnId = s.batchId.split('-i')[0];
                return supplierReceiptIds.has(grnId);
            })
            .map(batch => ({
                batch,
                product: products.find(p => p.id === batch.productId)!,
            }))
            .filter(item => item.product)
            .sort((a, b) => a.product.name.localeCompare(b.product.name) || new Date(a.batch.receiptDate).getTime() - new Date(b.batch.receiptDate).getTime());
    }, [supplierId, warehouseId, stock, products, goodsReceipts]);

    useEffect(() => {
        if (isOpen) {
            setReturnQuantities(new Map());
        }
    }, [isOpen]);

    const handleQuantityChange = (batchId: string, quantityStr: string, maxQuantity: number) => {
        const newQuantities = new Map(returnQuantities);
        const quantity = parseFloat(quantityStr);
        
        if (isNaN(quantity) || quantity <= 0) {
            newQuantities.delete(batchId);
        } else {
            const newQty = Math.min(quantity, maxQuantity);
            newQuantities.set(batchId, newQty);
        }
        setReturnQuantities(newQuantities);
    };

    const handleAddClick = () => {
        const productsToAdd = new Map<string, number>();
        returnQuantities.forEach((quantity, batchId) => {
            const productInfo = selectableProducts.find(p => p.batch.batchId === batchId);
            if (productInfo) {
                const existingQty = productsToAdd.get(productInfo.product.id) || 0;
                productsToAdd.set(productInfo.product.id, existingQty + quantity);
            }
        });

        onAddItems(Array.from(productsToAdd.entries()).map(([productId, quantity]) => ({ productId, quantity })));
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Qaytarish uchun mahsulot tanlash" size="4xl">
            <div className="space-y-4">
                <div className="overflow-y-auto max-h-[60vh] border rounded-lg">
                    <table className="w-full text-sm border-collapse">
                        <thead className="bg-slate-50 sticky top-0">
                            <tr>
                                <th className="px-3 py-2 text-left font-medium text-slate-600 border-r">Mahsulot</th>
                                <th className="px-3 py-2 text-right font-medium text-slate-600 border-r">Narxi</th>
                                <th className="px-3 py-2 text-left font-medium text-slate-600 border-r">Partiya №</th>
                                <th className="px-3 py-2 text-right font-medium text-slate-600 border-r">Qoldiq</th>
                                <th className="px-3 py-2 text-left font-medium text-slate-600 w-32">Qaytarish miqdori</th>
                            </tr>
                        </thead>
                        <tbody>
                            {selectableProducts.length > 0 ? selectableProducts.map(({ product, batch }) => (
                                <tr key={batch.batchId} className="border-b last:border-0 hover:bg-slate-50">
                                    <td className="px-3 py-2 border-r">{product.name}</td>
                                    <td className="px-3 py-2 text-right font-mono border-r">{formatCurrency(batch.cost)}</td>
                                    <td className="px-3 py-2 font-mono text-xs border-r">{batch.batchId}</td>
                                    <td className="px-3 py-2 text-right font-mono border-r">{batch.quantity.toFixed(2)}</td>
                                    <td className="px-3 py-2">
                                        <input
                                            type="number"
                                            value={returnQuantities.get(batch.batchId) || ''}
                                            onChange={(e) => handleQuantityChange(batch.batchId, e.target.value, batch.quantity)}
                                            max={batch.quantity}
                                            min="0"
                                            step="any"
                                            placeholder="0.00"
                                            className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-right"
                                        />
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="text-center py-10 text-slate-500">
                                        Bu ta'minotchidan olingan mahsulotlar omborda mavjud emas.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200">Bekor qilish</button>
                    <button type="button" onClick={handleAddClick} className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700">Tanlanganlarni qo'shish</button>
                </div>
            </div>
        </Modal>
    );
};


// ===================================================================
// =================== GOODS RETURN FORM MODAL =======================
// ===================================================================

interface GoodsReturnFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Omit<GoodsReturnNote, 'id' | 'status' | 'doc_number'> | GoodsReturnNote) => void;
    note: GoodsReturnNote | null;
    dataManager: UseMockDataReturnType;
    defaultWarehouseId: string | null;
}

type FormItem = { productId: string, quantity: number, availableQty: number, cost: number };

const GoodsReturnFormModal: React.FC<GoodsReturnFormModalProps> = ({isOpen, onClose, onSubmit, note, dataManager, defaultWarehouseId}) => {
    const { products, warehouses, suppliers, stock } = dataManager;
    const [formData, setFormData] = useState({ date: new Date().toISOString().split('T')[0], warehouse_id: '', supplier_id: '' });
    const [items, setItems] = useState<FormItem[]>([]);
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);

    const productsInStock = useMemo(() => {
        if (!formData.warehouse_id) return [];
        const productQuantities = new Map<string, number>();

        stock
            .filter(s => s.warehouseId === formData.warehouse_id)
            .forEach(s => {
                productQuantities.set(s.productId, (productQuantities.get(s.productId) || 0) + s.quantity);
            });
        
        return products
            .filter(p => (productQuantities.get(p.id) || 0) > 0)
            .map(p => ({ ...p, totalQuantity: productQuantities.get(p.id)! }));
    }, [formData.warehouse_id, stock, products]);


    useEffect(() => {
        if(isOpen) {
            if (note) {
                setFormData({ date: new Date(note.date).toISOString().split('T')[0], warehouse_id: note.warehouse_id, supplier_id: note.supplier_id });
                const updatedItems = note.items.map(item => {
                    const currentProductStock = stock
                        .filter(s => s.warehouseId === note.warehouse_id && s.productId === item.productId)
                        .reduce((sum, s) => sum + s.quantity, 0);
                    return { ...item, availableQty: currentProductStock + item.quantity };
                });
                setItems(updatedItems);
            } else {
                const warehouseToSet = defaultWarehouseId || warehouses.find(w => w.is_active)?.id || '';
                const supplierToSet = suppliers.filter(s => s.id !== 'SYSTEM')[0]?.id || '';
                setFormData({ date: new Date().toISOString().split('T')[0], warehouse_id: warehouseToSet, supplier_id: supplierToSet });
                setItems([]);
            }
        }
    }, [isOpen, note, warehouses, suppliers, defaultWarehouseId, stock]);


    const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }

    const handleItemQuantityChange = (index: number, quantityStr: string) => {
        const newItems = [...items];
        newItems[index].quantity = parseFloat(quantityStr) || 0;
        setItems(newItems);
    }
    
    const handleAddItems = (newlySelectedItems: { productId: string; quantity: number }[]) => {
        const updatedItems = [...items];
        
        newlySelectedItems.forEach(selected => {
            const existingItemIndex = updatedItems.findIndex(i => i.productId === selected.productId);
            if (existingItemIndex > -1) {
                updatedItems[existingItemIndex].quantity += selected.quantity;
            } else {
                const productInStock = productsInStock.find(p => p.id === selected.productId);
                updatedItems.push({
                    productId: selected.productId,
                    quantity: selected.quantity,
                    availableQty: productInStock?.totalQuantity || 0,
                    cost: 0, 
                });
            }
        });
        setItems(updatedItems);
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    }

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalItems: GoodsReturnItem[] = [];
        for (const item of items) {
            if (!item.productId || item.quantity <= 0) {
                 alert("Iltimos, har bir qatorda miqdorni to'g'ri kiriting.");
                 return;
            }
            if (item.quantity > item.availableQty) {
                const productName = products.find(p=>p.id === item.productId)?.name;
                alert(`Xatolik: "${productName}" mahsuloti uchun miqdor qoldiqdan ko'p kiritildi (${item.quantity} > ${item.availableQty}).`);
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
    
    const getProductInfo = (productId: string) => products.find(p => p.id === productId);

    return (
    <>
        <Modal isOpen={isOpen} onClose={onClose} title={note ? "Qaytarish hujjatini tahrirlash" : "Ta'minotchiga yangi qaytarish hujjati"} size="4xl" closeOnOverlayClick={false}>
            <form onSubmit={handleFormSubmit} className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-slate-700 mb-1">Sana</label>
                        <input type="date" name="date" id="date" value={formData.date} onChange={handleHeaderChange} required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg"/>
                    </div>
                    <div>
                        <label htmlFor="supplier_id" className="block text-sm font-medium text-slate-700 mb-1">Ta'minotchi</label>
                        <select name="supplier_id" id="supplier_id" value={formData.supplier_id} onChange={handleHeaderChange} required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg">
                           <option value="" disabled>Tanlang...</option>
                           {suppliers.filter(s=>s.id !== 'SYSTEM').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="warehouse_id" className="block text-sm font-medium text-slate-700 mb-1">Ombor</label>
                        <select name="warehouse_id" id="warehouse_id" value={formData.warehouse_id} onChange={handleHeaderChange} required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg">
                           <option value="" disabled>Tanlang...</option>
                           {warehouses.filter(w=>w.is_active).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="border-t pt-4">
                     <div className="flex justify-between items-center mb-3">
                        <h4 className="text-lg font-medium text-slate-800">Qaytariladigan mahsulotlar</h4>
                        <button type="button" onClick={() => setIsSelectorOpen(true)} disabled={!formData.supplier_id || !formData.warehouse_id} className="flex items-center gap-2 text-sm text-amber-600 hover:text-amber-800 font-medium disabled:text-slate-400 disabled:cursor-not-allowed">
                            <PlusIcon className="h-4 w-4"/> Mahsulot tanlash
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-2 py-2 text-left font-medium text-slate-600 border-r" style={{width: '60%'}}>Mahsulot (Qoldiq)</th>
                                    <th className="px-2 py-2 text-left font-medium text-slate-600 border-r">Miqdor</th>
                                    <th className="px-2 py-2"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, index) => {
                                    const product = getProductInfo(item.productId);
                                    return (
                                        <tr key={index} className="border-b">
                                            <td className="p-1 border-r">
                                                <div className="px-3 py-2">
                                                   <span className="font-medium">{product?.name}</span>
                                                   <span className="text-xs text-slate-500 ml-2">({item.availableQty.toFixed(2)} {product?.unit})</span>
                                                </div>
                                            </td>
                                            <td className="p-1 border-r">
                                                <input type="number" value={item.quantity} onChange={(e) => handleItemQuantityChange(index, e.target.value)} max={item.availableQty} min="0.01" step="any" className="w-full px-3 py-2 border border-slate-300 rounded-md" required/>
                                            </td>
                                            <td className="p-1 text-center">
                                                <button type="button" onClick={() => handleRemoveItem(index)} className="text-red-500 hover:text-red-700 p-1"><TrashIcon className="h-5 w-5"/></button>
                                            </td>
                                        </tr>
                                    )
                                })}
                                 {items.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="text-center py-6 text-slate-400">
                                            Qaytarish uchun mahsulotlar tanlanmagan.
                                        </td>
                                    </tr>
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

        <SelectProductsForReturnModal
            isOpen={isSelectorOpen}
            onClose={() => setIsSelectorOpen(false)}
            onAddItems={handleAddItems}
            supplierId={formData.supplier_id}
            warehouseId={formData.warehouse_id}
            dataManager={dataManager}
        />
    </>
    );
}