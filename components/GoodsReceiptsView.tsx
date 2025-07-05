
import React, { useState, useMemo, useEffect } from 'react';
import { GoodsReceiptNote, GoodsReceiptItem, DocumentStatus, PaymentStatus, Product, Supplier } from '../types';
import { UseMockDataReturnType } from '../hooks/useMockData';
import { Modal } from './Modal';
import { PlusIcon } from './icons/PlusIcon';
import { EditIcon } from './icons/EditIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { WarningIcon } from './icons/WarningIcon';
import { ProductFormModal } from './forms/ProductFormModal';
import { SupplierFormModal } from './forms/SupplierFormModal';


interface GoodsReceiptsViewProps {
  dataManager: UseMockDataReturnType;
  newDocumentPayload?: { type: string, product: Product } | null;
  clearPayload?: () => void;
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('uz-UZ').format(amount);
const formatDate = (date: Date) => date.toISOString().split('T')[0];

const getPaymentStatus = (note: GoodsReceiptNote, total: number): { status: PaymentStatus, text: string, className: string } => {
    if (note.paid_amount <= 0 && total > 0) {
        return { status: PaymentStatus.UNPAID, text: "To'lanmagan", className: 'bg-red-100 text-red-800' };
    }
    if (note.paid_amount >= total) {
        return { status: PaymentStatus.PAID, text: "To'langan", className: 'bg-green-100 text-green-800' };
    }
    if (note.paid_amount > 0) {
        return { status: PaymentStatus.PARTIALLY_PAID, text: "Qisman to'langan", className: 'bg-orange-100 text-orange-800' };
    }
    return { status: PaymentStatus.PAID, text: "To'langan", className: 'bg-green-100 text-green-800' };
}


export const GoodsReceiptsView: React.FC<GoodsReceiptsViewProps> = ({ dataManager, newDocumentPayload, clearPayload }) => {
  const { goodsReceipts, suppliers, warehouses, products, addGoodsReceipt, updateGoodsReceipt, deleteGoodsReceipt, confirmGoodsReceipt, getNoteTotal, checkCreditLimit } = dataManager;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<GoodsReceiptNote | null>(null);
  const [productForNewNote, setProductForNewNote] = useState<Product | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

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

  const filteredGoodsReceipts = useMemo(() => {
    const dateFrom = new Date(filters.dateFrom);
    dateFrom.setHours(0, 0, 0, 0);
    const dateTo = new Date(filters.dateTo);
    dateTo.setHours(23, 59, 59, 999);
    
    return goodsReceipts.filter(note => {
      const noteDate = new Date(note.date);
      return noteDate >= dateFrom && noteDate <= dateTo;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [goodsReceipts, filters]);

  useEffect(() => {
    if(newDocumentPayload?.type === 'quick-receipt' && newDocumentPayload.product) {
        handleOpenModal(null, newDocumentPayload.product);
        clearPayload?.();
    }
  }, [newDocumentPayload]);

  const handleOpenModal = (note: GoodsReceiptNote | null = null, productToAdd: Product | null = null) => {
    setEditingNote(note);
    setProductForNewNote(productToAdd);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingNote(null);
    setProductForNewNote(null);
  };

    const handleSave = (data: { date: string; supplier_id: string; warehouse_id: string; items: GoodsReceiptItem[], paid_amount: number }) => {
        if (editingNote) {
            updateGoodsReceipt({ ...editingNote, ...data });
        } else {
            addGoodsReceipt(data);
        }
        handleCloseModal();
    };

  const handleConfirm = (id: string) => {
    if (window.confirm("Hujjatni tasdiqlamoqchimisiz? Tasdiqlangan hujjatni o'zgartirib bo'lmaydi va zaxiralar yangilanadi.")) {
        try {
            confirmGoodsReceipt(id);
        } catch (error: any) {
            alert(`Xatolik: ${error.message}`);
        }
    }
  }
  
  const handleDelete = (id: string) => {
      if (window.confirm("Haqiqatan ham ushbu qoralama hujjatni o'chirmoqchimisiz?")) {
          deleteGoodsReceipt(id);
      }
  }
  
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

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Kirim Hujjatlari</h2>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2.5 rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all shadow"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Yangi Kirim</span>
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
              <th scope="col" className="px-6 py-3 border-r border-slate-200">Yetkazib beruvchi</th>
              <th scope="col" className="px-6 py-3 border-r border-slate-200">Ombor</th>
              <th scope="col" className="px-6 py-3 text-right border-r border-slate-200">Jami Summa</th>
              <th scope="col" className="px-6 py-3 border-r border-slate-200">To'lov Holati</th>
              <th scope="col" className="px-6 py-3 border-r border-slate-200">Hujjat Holati</th>
              <th scope="col" className="px-6 py-3 text-center">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredGoodsReceipts.map(note => {
              const total = getNoteTotal(note.items);
              const paymentStatus = getPaymentStatus(note, total);
              const isExpanded = expandedRows.has(note.id);
              const creditCheck = note.status === DocumentStatus.DRAFT ? checkCreditLimit(note) : { exceeds: false, amount: 0 };
              return (
              <React.Fragment key={note.id}>
                <tr onClick={() => handleToggleExpand(note.id)} className="hover:bg-slate-50 cursor-pointer">
                    <td className="px-2 py-4 text-center border-r border-slate-200">
                        <ChevronDownIcon className={`h-5 w-5 text-slate-400 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap border-r border-slate-200">
                        <div className="font-medium text-slate-900">{note.doc_number}</div>
                        <div className="text-xs text-slate-500">{new Date(note.date).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 border-r border-slate-200">{note.supplier_id === 'SYSTEM' ? 'Tizim (Inventarizatsiya)' : suppliers.find(s => s.id === note.supplier_id)?.name || 'Noma\'lum'}</td>
                    <td className="px-6 py-4 text-slate-600 border-r border-slate-200">{warehouses.find(w => w.id === note.warehouse_id)?.name || 'Noma\'lum'}</td>
                    <td className="px-6 py-4 text-right font-mono text-slate-800 border-r border-slate-200">{formatCurrency(total)}</td>
                    <td className="px-6 py-4 border-r border-slate-200">
                      <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${paymentStatus.className}`}>
                            {paymentStatus.text}
                          </span>
                          <div className="relative group">
                            <span className="text-slate-400 cursor-help text-xs font-bold border border-slate-400 rounded-full w-4 h-4 flex items-center justify-center">?</span>
                            <div className="absolute bottom-full z-10 mb-2 -left-1/2 w-64 p-2 bg-slate-700 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                              To'lovlar 'Hujjatlar {'>'} To'lovlar' bo'limida amalga oshiriladi va avtomatik ravishda eng eski qarzdorlikka yopiladi (FIFO).
                            </div>
                          </div>
                      </div>
                    </td>
                     <td className="px-6 py-4 border-r border-slate-200">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${note.status === DocumentStatus.CONFIRMED ? 'bg-amber-100 text-amber-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {note.status === DocumentStatus.CONFIRMED ? 'Tasdiqlangan' : 'Qoralama'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                        <div className="flex justify-center items-center gap-2">
                          {note.status === DocumentStatus.DRAFT ? (
                            <>
                                <button onClick={(e) => { e.stopPropagation(); handleOpenModal(note); }} title="Tahrirlash" className="p-2 rounded-full text-amber-600 hover:bg-amber-100 transition-colors"><EditIcon className="h-5 w-5"/></button>
                                <button onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }} title="O'chirish" className="p-2 rounded-full text-red-600 hover:bg-red-100 transition-colors"><TrashIcon className="h-5 w-5"/></button>
                                <div className="relative group flex items-center">
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleConfirm(note.id); }} 
                                    className="px-3 py-1.5 bg-green-500 text-white text-xs font-semibold rounded-md hover:bg-green-600 transition-colors disabled:bg-green-300 disabled:cursor-not-allowed"
                                    disabled={creditCheck.exceeds}
                                  >
                                    Tasdiqlash
                                  </button>
                                  {creditCheck.exceeds && (
                                    <>
                                      <WarningIcon className="h-5 w-5 text-yellow-500 ml-2"/>
                                      <div className="absolute bottom-full z-10 mb-2 right-0 w-64 p-2 bg-yellow-100 text-yellow-800 border border-yellow-300 text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                        Diqqat! Bu hujjatni tasdiqlash yetkazib beruvchining kredit limitidan <b>{formatCurrency(creditCheck.amount)} so'm</b>ga oshib ketishiga olib keladi.
                                      </div>
                                    </>
                                  )}
                                </div>
                            </>
                          ) : (
                             <>
                                <button title="Tasdiqlangan hujjatni tahrirlab bo'lmaydi" disabled className="p-2 rounded-full text-slate-400 cursor-not-allowed"><EditIcon className="h-5 w-5"/></button>
                                <button title="Tasdiqlangan hujjatni o'chirib bo'lmaydi" disabled className="p-2 rounded-full text-slate-400 cursor-not-allowed"><TrashIcon className="h-5 w-5"/></button>
                             </>
                          )}
                        </div>
                    </td>
                </tr>
                {isExpanded && (
                    <tr className="bg-slate-50">
                        <td colSpan={8} className="p-0">
                            <div className="px-8 py-4">
                                <h4 className="text-sm font-semibold text-slate-700 mb-2">Hujjat tarkibi</h4>
                                {note.items.length > 0 ? (
                                    <table className="w-full text-xs bg-white rounded border-collapse">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="p-2 text-left font-medium border-r border-slate-200">Mahsulot</th>
                                                <th className="p-2 text-right font-medium border-r border-slate-200">Miqdor</th>
                                                <th className="p-2 text-right font-medium border-r border-slate-200">Narx</th>
                                                <th className="p-2 text-right font-medium">Summa</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                        {note.items.map((item, index) => (
                                            <tr key={index} className="border-b last:border-b-0">
                                                <td className="p-2 border-r border-slate-200">{products.find(p => p.id === item.productId)?.name || 'Noma\'lum'}</td>
                                                <td className="p-2 text-right font-mono border-r border-slate-200">{item.quantity}</td>
                                                <td className="p-2 text-right font-mono border-r border-slate-200">{formatCurrency(item.price)}</td>
                                                <td className="p-2 text-right font-mono">{formatCurrency(item.price * item.quantity)}</td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p className="text-xs text-slate-500 text-center py-4">Hujjatda mahsulotlar yo'q.</p>
                                )}
                            </div>
                        </td>
                    </tr>
                )}
              </React.Fragment>
            )})}
             {filteredGoodsReceipts.length === 0 && (
                <tr><td colSpan={8} className="text-center py-10 text-slate-500">Hujjatlar topilmadi.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      
      <GoodsReceiptFormModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        note={editingNote}
        dataManager={dataManager}
        productToAdd={productForNewNote}
      />
    </div>
  );
};

interface GoodsReceiptFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { date: string; supplier_id: string; warehouse_id: string; items: GoodsReceiptItem[]; paid_amount: number }) => void;
    note: GoodsReceiptNote | null;
    dataManager: UseMockDataReturnType;
    productToAdd?: Product | null;
}

const GoodsReceiptFormModal: React.FC<GoodsReceiptFormModalProps> = ({isOpen, onClose, onSave, note, dataManager, productToAdd}) => {
    const { products, suppliers, warehouses, getNoteTotal, generateNextBatchNumber, addProduct, updateProduct, addSupplier, updateSupplier, isInnUnique } = dataManager;
    const [formData, setFormData] = useState({ date: new Date().toISOString().split('T')[0], supplier_id: '', warehouse_id: '' });
    const [items, setItems] = useState<Omit<GoodsReceiptItem, 'id'>[]>([]);
    const [paidAmount, setPaidAmount] = useState(0);

    const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [editingProductIndex, setEditingProductIndex] = useState<number | null>(null);

    const totalAmount = useMemo(() => getNoteTotal(items as GoodsReceiptItem[]), [items, getNoteTotal]);

    useEffect(() => {
        if(isOpen) {
             if (note) {
                setFormData({ date: new Date(note.date).toISOString().split('T')[0], supplier_id: note.supplier_id, warehouse_id: note.warehouse_id });
                setItems(note.items);
                setPaidAmount(note.paid_amount || 0);
            } else {
                setFormData({ date: new Date().toISOString().split('T')[0], supplier_id: suppliers[0]?.id || '', warehouse_id: warehouses.find(w=>w.is_active)?.id || '' });
                setPaidAmount(0);
                if(productToAdd){
                    const batch_number = generateNextBatchNumber(productToAdd.id);
                    setItems([{ productId: productToAdd.id, quantity: 1, price: 0, batch_number: batch_number, expiry_date: undefined }])
                } else {
                    setItems([]);
                }
            }
        }
    }, [note, isOpen, suppliers, warehouses, productToAdd, generateNextBatchNumber]);

    const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }

    const handleItemChange = (index: number, field: keyof GoodsReceiptItem, value: string | number) => {
        const newItems = [...items];
        let val: any = value;
        if (field === 'quantity' || field === 'price') {
           val = typeof value === 'string' ? parseFloat(value) : value;
        }
        if (field === 'expiry_date' && typeof value === 'string') {
            val = value ? new Date(value).toISOString() : undefined;
        }
        
        (newItems[index] as any)[field] = val;

        if (field === 'productId') {
            const batch_number = generateNextBatchNumber(val as string);
            (newItems[index] as any)['batch_number'] = batch_number;
        }
        setItems(newItems);
    }

    const handleAddItem = () => {
        setItems([...items, { productId: '', quantity: 1, price: 0, batch_number: '', expiry_date: undefined }]);
    }

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    }

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (items.some(it => !it.productId || it.quantity <= 0 || it.price < 0 || !it.batch_number)) {
            alert("Iltimos, mahsulotlar ro'yxatini to'g'ri to'ldiring (mahsulot, miqdor, narx, partiya raqami).");
            return;
        }
        onSave({ ...formData, date: new Date(formData.date).toISOString(), items, paid_amount: paidAmount });
    }

    const getProductUnit = (productId: string) => products.find(p => p.id === productId)?.unit || '';

    // --- Supplier Modal Handlers ---
    const handleOpenSupplierModal = (supplier: Supplier | null) => {
        setEditingSupplier(supplier);
        setIsSupplierModalOpen(true);
    };

    const handleSupplierFormSubmit = (data: Omit<Supplier, 'id'> | Supplier) => {
        if ('id' in data) {
            updateSupplier(data);
        } else {
            const newSupplier = addSupplier(data);
            setFormData(prev => ({...prev, supplier_id: newSupplier.id}));
        }
        setIsSupplierModalOpen(false);
    };

    // --- Product Modal Handlers ---
    const handleOpenProductModal = (product: Product | null, index: number | null) => {
        setEditingProduct(product);
        setEditingProductIndex(index);
        setIsProductModalOpen(true);
    };

    const handleProductFormSubmit = (data: Omit<Product, 'id'> | Product) => {
        if ('id' in data) {
            updateProduct(data);
        } else {
            if (editingProductIndex === null) return;
            const newProduct = addProduct(data);
            
            const newItems = [...items];
            const itemToUpdate = newItems[editingProductIndex];

            itemToUpdate.productId = newProduct.id;
            
            if (!itemToUpdate.batch_number) {
                itemToUpdate.batch_number = generateNextBatchNumber(newProduct.id);
            }
            setItems(newItems);
        }
        setIsProductModalOpen(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={note ? "Kirimni tahrirlash" : "Yangi kirim hujjati"} size="5xl">
            <form onSubmit={handleFormSubmit} className="space-y-6">
                {/* Header */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-slate-700 mb-1">Sana</label>
                        <input type="date" name="date" id="date" value={formData.date} onChange={handleHeaderChange} required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg"/>
                    </div>
                    <div>
                        <label htmlFor="supplier_id" className="block text-sm font-medium text-slate-700 mb-1">Yetkazib beruvchi</label>
                        <div className="flex items-center gap-2">
                            <select name="supplier_id" id="supplier_id" value={formData.supplier_id} onChange={handleHeaderChange} required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg">
                               {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            <button type="button" title="Yangi yetkazib beruvchi qo'shish" onClick={() => handleOpenSupplierModal(null)} className="flex-shrink-0 p-2.5 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                                <PlusIcon className="h-5 w-5 text-slate-600"/>
                            </button>
                            <button
                                type="button"
                                title="Yetkazib beruvchini tahrirlash"
                                onClick={() => {
                                    const supplierToEdit = suppliers.find(s => s.id === formData.supplier_id);
                                    if (supplierToEdit) handleOpenSupplierModal(supplierToEdit);
                                }}
                                disabled={!formData.supplier_id}
                                className="flex-shrink-0 p-2.5 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors disabled:text-slate-300 disabled:cursor-not-allowed"
                            >
                                <EditIcon className="h-5 w-5"/>
                            </button>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="warehouse_id" className="block text-sm font-medium text-slate-700 mb-1">Qabul qiluvchi ombor</label>
                        <select name="warehouse_id" id="warehouse_id" value={formData.warehouse_id} onChange={handleHeaderChange} required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg">
                           {warehouses.filter(w=>w.is_active).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                    </div>
                </div>

                {/* Items */}
                <div className="border-t pt-4">
                    <h4 className="text-lg font-medium text-slate-800 mb-3">Mahsulotlar</h4>
                    <div className="overflow-auto border rounded-lg min-h-[240px] max-h-[45vh]">
                        <table className="w-full text-sm border-collapse">
                            <thead className="bg-slate-50 sticky top-0 z-10">
                                <tr>
                                    <th className="px-2 py-2 text-left font-medium text-slate-600 border-r border-slate-200" style={{width: '25%'}}>Mahsulot</th>
                                    <th className="px-2 py-2 text-left font-medium text-slate-600 border-r border-slate-200">Partiya №</th>
                                    <th className="px-2 py-2 text-left font-medium text-slate-600 border-r border-slate-200">Yaroqlilik m.</th>
                                    <th className="px-2 py-2 text-left font-medium text-slate-600 border-r border-slate-200">Miqdor</th>
                                    <th className="px-2 py-2 text-left font-medium text-slate-600 border-r border-slate-200">Narx</th>
                                    <th className="px-2 py-2 text-left font-medium text-slate-600 border-r border-slate-200">Summa</th>
                                    <th className="px-2 py-2"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {items.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="text-center py-16 text-slate-500">
                                            Hujjatga mahsulot qo'shilmagan.<br/>
                                            "Qator qo'shish" tugmasini bosing.
                                        </td>
                                    </tr>
                                )}
                                {items.map((item, index) => (
                                    <tr key={index}>
                                        <td className="p-1 border-r border-slate-200">
                                            <div className="flex items-center gap-1">
                                                <select value={item.productId} onChange={(e) => handleItemChange(index, 'productId', e.target.value)} className="w-full px-3 py-2.5 border border-slate-300 rounded-md">
                                                    <option value="" disabled>Tanlang...</option>
                                                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                </select>
                                                <button type="button" title="Yangi mahsulot qo'shish" onClick={() => handleOpenProductModal(null, index)} className="flex-shrink-0 p-2 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors">
                                                    <PlusIcon className="h-4 w-4 text-slate-500"/>
                                                </button>
                                                <button
                                                    type="button"
                                                    title="Mahsulotni tahrirlash"
                                                    onClick={() => {
                                                        const productToEdit = products.find(p => p.id === item.productId);
                                                        if (productToEdit) handleOpenProductModal(productToEdit, index);
                                                    }}
                                                    disabled={!item.productId}
                                                    className="flex-shrink-0 p-2 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors disabled:text-slate-300 disabled:cursor-not-allowed"
                                                >
                                                    <EditIcon className="h-4 w-4"/>
                                                </button>
                                            </div>
                                        </td>
                                        <td className="p-1 border-r border-slate-200"><input type="text" value={item.batch_number} onChange={(e) => handleItemChange(index, 'batch_number', e.target.value)} className="w-full px-3 py-2.5 border border-slate-300 rounded-md" required /></td>
                                        <td className="p-1 border-r border-slate-200"><input type="date" value={item.expiry_date ? item.expiry_date.split('T')[0] : ''} onChange={(e) => handleItemChange(index, 'expiry_date', e.target.value)} className="w-full px-3 py-2.5 border border-slate-300 rounded-md"/></td>
                                        <td className="p-1 border-r border-slate-200">
                                            <div className="relative">
                                                <input type="number" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} min="0.01" step="any" className="w-full px-3 py-2.5 pr-10 border border-slate-300 rounded-md"/>
                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">{getProductUnit(item.productId)}</span>
                                            </div>
                                        </td>
                                        <td className="p-1 border-r border-slate-200"><input type="number" value={item.price} onChange={(e) => handleItemChange(index, 'price', e.target.value)} min="0" step="any" className="w-full px-3 py-2.5 border border-slate-300 rounded-md"/></td>
                                        <td className="p-1 font-mono border-r border-slate-200">{formatCurrency(item.quantity * item.price)}</td>
                                        <td className="p-1 text-center">
                                            <button type="button" onClick={() => handleRemoveItem(index)} className="text-red-500 hover:text-red-700"><TrashIcon className="h-5 w-5"/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <button type="button" onClick={handleAddItem} className="mt-4 flex items-center gap-2 text-sm text-amber-600 hover:text-amber-800 font-medium">
                        <PlusIcon className="h-4 w-4"/> Qator qo'shish
                    </button>
                </div>
                
                {/* Footer */}
                <div className="flex justify-between items-center pt-4 border-t">
                     <div className="flex items-center gap-6">
                        <div>
                            <span className="text-sm font-medium text-slate-600">Jami summa: </span>
                            <span className="text-lg font-bold text-slate-800 font-mono">{formatCurrency(totalAmount)} so'm</span>
                        </div>
                        <div className="border-l-2 border-slate-200 pl-6">
                            <label htmlFor="paidAmount" className="block text-sm font-medium text-slate-700 mb-1">To'lov miqdori</label>
                            <input
                                type="number"
                                id="paidAmount"
                                value={paidAmount}
                                onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                                className="w-48 px-3 py-2 border border-slate-300 rounded-lg font-mono"
                                min="0"
                                step="any"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200">Bekor qilish</button>
                        <button type="submit" className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700">Saqlash</button>
                    </div>
                </div>
            </form>

            <SupplierFormModal
                isOpen={isSupplierModalOpen}
                onClose={() => setIsSupplierModalOpen(false)}
                onSubmit={handleSupplierFormSubmit}
                supplier={editingSupplier}
                isInnUnique={isInnUnique}
            />
            <ProductFormModal
                isOpen={isProductModalOpen}
                onClose={() => setIsProductModalOpen(false)}
                onSubmit={handleProductFormSubmit}
                product={editingProduct}
            />
        </Modal>
    );
}
