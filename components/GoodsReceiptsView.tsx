
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { GoodsReceiptNote, GoodsReceiptItem, DocumentStatus, PaymentStatus, Product, Supplier, PaymentMethod, Warehouse } from '../types';
import { UseMockDataReturnType } from '../hooks/useMockData';
import { Modal } from './Modal';
import { PlusIcon } from './icons/PlusIcon';
import { EditIcon } from './icons/EditIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { WarningIcon } from './icons/WarningIcon';
import { ProductFormModal } from './forms/ProductFormModal';
import { SupplierFormModal } from './forms/SupplierFormModal';
import { WarehouseFormModal } from './forms/WarehouseFormModal';
import { CashIcon } from './icons/CashIcon';
import { ConfirmationModal } from './ConfirmationModal';
import { SearchableSelect } from './SearchableSelect';
import { PriceAdjustmentFormModal } from './forms/PriceAdjustmentFormModal';


interface GoodsReceiptsViewProps {
  dataManager: UseMockDataReturnType;
  newDocumentPayload?: { type: string, product: Product } | null;
  clearPayload?: () => void;
  defaultWarehouseId: string | null;
  appMode: 'pro' | 'lite';
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


export const GoodsReceiptsView: React.FC<GoodsReceiptsViewProps> = ({ dataManager, newDocumentPayload, clearPayload, defaultWarehouseId, appMode }) => {
  const { goodsReceipts, suppliers, warehouses, products, addGoodsReceipt, updateGoodsReceipt, deleteGoodsReceipt, confirmGoodsReceipt, getNoteTotal, addDirectPaymentForNote, addAndConfirmGoodsReceipt, updateAndConfirmGoodsReceipt, addPriceAdjustmentNote, addAndConfirmPriceAdjustmentNote, priceAdjustments } = dataManager;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<GoodsReceiptNote | null>(null);
  const [productForNewNote, setProductForNewNote] = useState<Product | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [paymentModalNote, setPaymentModalNote] = useState<GoodsReceiptNote | null>(null);
  const [noteToConfirm, setNoteToConfirm] = useState<string | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [adjustmentModalState, setAdjustmentModalState] = useState<{ note: GoodsReceiptNote, item: GoodsReceiptItem, itemIndex: number } | null>(null);


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

    const handleSave = (data: { date: string; supplier_id: string; warehouse_id: string; items: GoodsReceiptItem[], paid_amount: number, payment_method: PaymentMethod }, action: 'save' | 'save_and_confirm') => {
        if (editingNote) {
            const updatedNote = { ...editingNote, ...data };
            if (action === 'save_and_confirm') {
                updateAndConfirmGoodsReceipt(updatedNote);
            } else {
                updateGoodsReceipt(updatedNote);
            }
        } else {
            if (action === 'save_and_confirm') {
                addAndConfirmGoodsReceipt(data);
            } else {
                addGoodsReceipt(data);
            }
        }
        handleCloseModal();
    };

  const handleConfirmClick = (id: string) => {
    setNoteToConfirm(id);
  }

  const handleConfirm = () => {
    if (!noteToConfirm) return;
    try {
        confirmGoodsReceipt(noteToConfirm);
        setNoteToConfirm(null);
    } catch (error: any) {
        alert(`Xatolik: ${error.message}`);
    }
  }
  
  const handleDeleteClick = (id: string) => {
    setNoteToDelete(id);
  };

  const handleConfirmDelete = () => {
    if (noteToDelete) {
      deleteGoodsReceipt(noteToDelete);
      setNoteToDelete(null);
    }
  };

  const handleExtinguishDebt = (note: GoodsReceiptNote) => {
    setPaymentModalNote(note);
  };

  const handlePaymentSubmit = (noteId: string, amount: number, paymentMethod: PaymentMethod, comment: string) => {
    try {
        addDirectPaymentForNote(noteId, amount, paymentMethod, comment);
        setPaymentModalNote(null); // Close modal on success
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

  const handleOpenAdjustmentModal = (note: GoodsReceiptNote, item: GoodsReceiptItem, itemIndex: number) => {
    setAdjustmentModalState({ note, item, itemIndex });
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
          <tbody>
            {filteredGoodsReceipts.map(note => {
              const total = getNoteTotal(note.items);
              const paymentStatus = getPaymentStatus(note, total);
              const isExpanded = expandedRows.has(note.id);
              const supplierName = note.supplier_id === 'SYSTEM' ? 'Tizim (Inventarizatsiya)' : suppliers.find(s => s.id === note.supplier_id)?.name || 'Noma\'lum';
              return (
              <React.Fragment key={note.id}>
                <tr onClick={() => handleToggleExpand(note.id)} className={`${isExpanded ? 'bg-amber-50' : 'hover:bg-slate-50'} cursor-pointer border-b border-slate-200`}>
                    <td className="px-2 py-4 text-center border-r border-slate-200">
                        <ChevronDownIcon className={`h-5 w-5 text-slate-400 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap border-r border-slate-200">
                        <div className="font-medium text-slate-900">{note.doc_number}</div>
                        <div className="text-xs text-slate-500">{new Date(note.date).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 border-r border-slate-200">
                        <span>{supplierName}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 border-r border-slate-200">{warehouses.find(w => w.id === note.warehouse_id)?.name || 'Noma\'lum'}</td>
                    <td className="px-6 py-4 text-right font-mono text-slate-800 border-r border-slate-200">{formatCurrency(total)}</td>
                    <td className="px-6 py-4 border-r border-slate-200">
                      <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${paymentStatus.className}`}>
                            {paymentStatus.text}
                          </span>
                          {note.status === DocumentStatus.CONFIRMED && (paymentStatus.status === PaymentStatus.UNPAID || paymentStatus.status === PaymentStatus.PARTIALLY_PAID) && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleExtinguishDebt(note); }} 
                                title="Qarzni to'lash"
                                className="p-1 rounded-full text-green-600 hover:bg-green-100 transition-colors"
                            >
                                <CashIcon className="h-5 w-5"/>
                            </button>
                           )}
                          <div className="relative group">
                            <span className="text-slate-400 cursor-help text-xs font-bold border border-slate-400 rounded-full w-4 h-4 flex items-center justify-center">?</span>
                            <div className="absolute bottom-full z-10 mb-2 -left-1/2 w-64 p-2 bg-slate-700 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                              Umumiy to'lovlar 'Hujjatlar &gt; To'lovlar' bo'limida amalga oshiriladi. Bu tugma faqat shu hujjat qarzini to'liq yopish uchun mo'ljallangan.
                            </div>
                          </div>
                      </div>
                    </td>
                     <td className="px-6 py-4 border-r border-slate-200">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${note.status === DocumentStatus.CONFIRMED ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {note.status === DocumentStatus.CONFIRMED ? 'Tasdiqlangan' : 'Qoralama'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                        <div className="flex justify-center items-center gap-2">
                          {note.status === DocumentStatus.DRAFT ? (
                            <>
                                <button onClick={(e) => { e.stopPropagation(); handleOpenModal(note); }} title="Tahrirlash" className="p-2 rounded-full text-amber-600 hover:bg-amber-100 transition-colors"><EditIcon className="h-5 w-5"/></button>
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(note.id); }} title="O'chirish" className="p-2 rounded-full text-red-600 hover:bg-red-100 transition-colors"><TrashIcon className="h-5 w-5"/></button>
                                <div className="relative group flex items-center">
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleConfirmClick(note.id); }} 
                                    className="px-3 py-1.5 bg-green-500 text-white text-xs font-semibold rounded-md hover:bg-green-600 transition-colors disabled:bg-green-300 disabled:cursor-not-allowed"
                                  >
                                    Tasdiqlash
                                  </button>
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
                <tr>
                  <td colSpan={8} className="p-0 border-0">
                    <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                      <div className="overflow-hidden">
                        <div className="px-8 py-4 bg-amber-50">
                            <h4 className="text-sm font-semibold text-slate-700 mb-2">Hujjat tarkibi</h4>
                            {note.items.length > 0 ? (
                                <table className="w-full text-xs bg-white rounded border-collapse">
                                    <thead className="text-slate-500 uppercase">
                                        <tr className="border-b">
                                            <th className="p-2 text-left font-medium border-r border-slate-200">Mahsulot</th>
                                            {appMode === 'pro' && <th className="p-2 text-left font-medium border-r border-slate-200">Partiya №</th>}
                                            {appMode === 'pro' && <th className="p-2 text-left font-medium border-r border-slate-200">Yaroqlilik muddati</th>}
                                            <th className="p-2 text-right font-medium border-r border-slate-200">Miqdor</th>
                                            <th className="p-2 text-right font-medium border-r border-slate-200">Narx</th>
                                            <th className="p-2 text-right font-medium border-r border-slate-200">Summa</th>
                                            <th className="p-2 text-center font-medium">Amallar</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                    {note.items.map((item, index) => {
                                      const adjustment = priceAdjustments.find(pa => pa.status === DocumentStatus.CONFIRMED && pa.goodsReceiptNoteId === note.id && pa.items.some(pi => pi.batchId === item.batchId));
                                      const adjustedItem = adjustment?.items.find(pi => pi.batchId === item.batchId);
                                      const displayPrice = adjustedItem ? adjustedItem.newPrice : item.price;

                                      return (
                                        <tr key={index} className="border-b last:border-b-0">
                                            <td className="p-2 border-r border-slate-200">{products.find(p => p.id === item.productId)?.name || 'Noma\'lum'}</td>
                                            {appMode === 'pro' && <td className="p-2 font-mono text-xs border-r border-slate-200">{item.batchId}</td>}
                                            {appMode === 'pro' && <td className="p-2 border-r border-slate-200">{new Date(item.validDate).toLocaleDateString()}</td>}
                                            <td className="p-2 text-right font-mono border-r border-slate-200">{item.quantity}</td>
                                            <td className="p-2 text-right font-mono border-r border-slate-200">
                                                {formatCurrency(displayPrice)}
                                                {adjustedItem && <span className="ml-1 text-amber-600" title={`Asl narx: ${formatCurrency(item.price)}\n${adjustment.doc_number} bilan o'zgartirildi.`}>*</span>}
                                            </td>
                                            <td className="p-2 text-right font-mono border-r border-slate-200">{formatCurrency(displayPrice * item.quantity)}</td>
                                            <td className="p-2 text-center">
                                                {note.status === DocumentStatus.CONFIRMED && note.supplier_id !== 'SYSTEM' && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleOpenAdjustmentModal(note, item, index);
                                                        }}
                                                        title="Narxni to'g'irlash"
                                                        className="p-1.5 rounded-full text-amber-600 hover:bg-amber-100 transition-colors"
                                                    >
                                                        <EditIcon className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                      );
                                    })}
                                    </tbody>
                                     <tfoot className="bg-slate-50 font-semibold">
                                        <tr>
                                            <td colSpan={appMode === 'pro' ? 6 : 4} className="p-2 text-right border-r border-slate-200">Jami:</td>
                                            <td className="p-2 text-right font-mono">{formatCurrency(getNoteTotal(note.items))}</td>
                                            <td></td>
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
             {filteredGoodsReceipts.length === 0 && (
                <tr><td colSpan={8} className="text-center py-10 text-slate-500">Hujjatlar topilmadi.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      
      <GoodsReceiptFormModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSave}
        note={editingNote}
        productForNewNote={productForNewNote}
        dataManager={dataManager}
        defaultWarehouseId={defaultWarehouseId}
        appMode={appMode}
      />
      <DebtPaymentModal
        isOpen={!!paymentModalNote}
        note={paymentModalNote}
        onClose={() => setPaymentModalNote(null)}
        onSubmit={handlePaymentSubmit}
        getNoteTotal={getNoteTotal}
      />
      <ConfirmationModal
        isOpen={!!noteToConfirm}
        onClose={() => setNoteToConfirm(null)}
        onConfirm={handleConfirm}
        title="Hujjatni tasdiqlash"
        message={<>Hujjatni tasdiqlamoqchimisiz? <br/> Tasdiqlangan hujjatni o'zgartirib bo'lmaydi va zaxiralar yangilanadi.</>}
        confirmButtonText="Ha, tasdiqlash"
      />
      <ConfirmationModal
        isOpen={!!noteToDelete}
        onClose={() => setNoteToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Hujjatni o'chirish"
        message="Haqiqatan ham ushbu qoralama hujjatni o'chirmoqchimisiz? Bu amalni bekor qilib bo'lmaydi."
        confirmButtonText="Ha, o'chirish"
      />
      <PriceAdjustmentFormModal
        isOpen={!!adjustmentModalState}
        onClose={() => setAdjustmentModalState(null)}
        onSaveDraft={addPriceAdjustmentNote}
        onConfirm={addAndConfirmPriceAdjustmentNote}
        dataManager={dataManager}
        adjustmentData={adjustmentModalState}
      />
    </div>
  );
};

// ===================================================================
// =================== PAYMENT MODAL FOR A SPECIFIC NOTE =============
// ===================================================================

interface DebtPaymentModalProps {
    isOpen: boolean;
    note: GoodsReceiptNote | null;
    onClose: () => void;
    onSubmit: (noteId: string, amount: number, paymentMethod: PaymentMethod, comment: string) => void;
    getNoteTotal: (items: GoodsReceiptItem[]) => number;
}

const DebtPaymentModal: React.FC<DebtPaymentModalProps> = ({ isOpen, note, onClose, onSubmit, getNoteTotal }) => {
    const [amount, setAmount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
    const [dueAmount, setDueAmount] = useState(0);

    useEffect(() => {
        if (note) {
            const total = getNoteTotal(note.items);
            const due = total - note.paid_amount;
            setDueAmount(due);
            setAmount(due);
            setPaymentMethod(PaymentMethod.CASH);
        }
    }, [note, getNoteTotal]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!note) return;
        if (amount <= 0) {
            alert("To'lov summasi noldan katta bo'lishi kerak.");
            return;
        }
        if (amount > dueAmount + 0.01) { // Add epsilon for float comparison
             alert("To'lov summasi qarz miqdoridan oshib ketmasligi kerak.");
            return;
        }
        onSubmit(note.id, amount, paymentMethod, `"${note.doc_number}" hujjat uchun to'lov.`);
    };

    if (!isOpen || !note) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`To'lov: ${note.doc_number}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <div className="text-sm text-slate-600 mb-2">
                        Jami qarz: <span className="font-bold font-mono text-red-600">{formatCurrency(dueAmount)}</span> so'm
                    </div>
                </div>
                <div>
                    <label htmlFor="paymentAmount" className="block text-sm font-medium text-slate-700 mb-1">
                        To'lov miqdori
                    </label>
                    <input
                        type="number"
                        id="paymentAmount"
                        value={amount}
                        onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                        max={dueAmount}
                        min="0"
                        step="any"
                        required
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500"
                    />
                </div>
                <div>
                    <label htmlFor="paymentMethod" className="block text-sm font-medium text-slate-700 mb-1">
                        To'lov usuli
                    </label>
                    <select
                        id="paymentMethod"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                        required
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500"
                    >
                        {Object.values(PaymentMethod).map(method => (
                            <option key={method} value={method}>{method}</option>
                        ))}
                    </select>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200">
                        Bekor qilish
                    </button>
                    <button type="submit" className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700">
                        To'lash
                    </button>
                </div>
            </form>
        </Modal>
    );
};


// ===================================================================
// =================== MODAL FORM FOR GOODS RECEIPT ==================
// ===================================================================

interface GoodsReceiptFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { date: string; supplier_id: string; warehouse_id: string; items: GoodsReceiptItem[], paid_amount: number, payment_method: PaymentMethod }, action: 'save' | 'save_and_confirm') => void;
  note: GoodsReceiptNote | null;
  productForNewNote: Product | null;
  dataManager: UseMockDataReturnType;
  defaultWarehouseId: string | null;
  appMode: 'pro' | 'lite';
}


const GoodsReceiptFormModal: React.FC<GoodsReceiptFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  note,
  productForNewNote,
  dataManager,
  defaultWarehouseId,
  appMode,
}) => {
  const { products, warehouses, suppliers, addProduct, updateProduct, addSupplier, updateSupplier, isInnUnique, addWarehouse, updateWarehouse, getNextBatchNumber, goodsReceipts } = dataManager;
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    supplier_id: '',
    warehouse_id: '',
    paid_amount: 0,
    payment_method: PaymentMethod.CASH,
  });
  const [items, setItems] = useState<GoodsReceiptItem[]>([]);
  
  const [productModalState, setProductModalState] = useState<{isOpen: boolean, product: Product | null, index: number | null}>({isOpen: false, product: null, index: null});
  const [supplierModalState, setSupplierModalState] = useState<{isOpen: boolean, supplier: Supplier | null}>({isOpen: false, supplier: null});
  const [warehouseModalState, setWarehouseModalState] = useState<{isOpen: boolean, warehouse: Warehouse | null}>({isOpen: false, warehouse: null});

  const firstProductInputRef = useRef<HTMLInputElement>(null);

  const productOptions = useMemo(() => {
    return products.map(p => ({
        value: p.id,
        label: `${p.name} (${p.unit})`
    }));
  }, [products]);

  const formatNumberWithSpaces = (num: number): string => {
    if (num === null || num === undefined) return '';
    const parts = num.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return parts.join('.');
  };

  useEffect(() => {
    if (!isOpen) {
        return;
    }

    if (note) { // Editing mode
        setFormData({
            date: new Date(note.date).toISOString().split('T')[0],
            supplier_id: note.supplier_id,
            warehouse_id: note.warehouse_id,
            paid_amount: note.paid_amount,
            payment_method: note.payment_method || PaymentMethod.CASH
        });
        setItems(note.items.map(item => ({...item})));
    } else { // New note mode
        const startBatchNum = getNextBatchNumber();
        const defaultDate = new Date();
        const validDate = new Date();
        validDate.setMonth(validDate.getMonth() + 6);

        const warehouseToSet = defaultWarehouseId || warehouses.find(w => w.is_active)?.id;
        setFormData({
            date: formatDate(defaultDate),
            supplier_id: suppliers.length > 0 ? suppliers[0].id : '',
            warehouse_id: warehouseToSet || '',
            paid_amount: 0,
            payment_method: PaymentMethod.CASH
        });
        
        const newItem: GoodsReceiptItem = {
            productId: productForNewNote ? productForNewNote.id : '',
            quantity: 0,
            price: 0,
            batchId: startBatchNum.toString(),
            validDate: formatDate(validDate)
        };
        setItems([newItem]);

        setTimeout(() => {
            firstProductInputRef.current?.focus();
        }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, note, productForNewNote]);

  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'paid_amount' ? parseFloat(value.replace(/\s/g, '')) || 0 : value,
    }));
  };

  const handleItemChange = (index: number, field: keyof GoodsReceiptItem, value: any) => {
    setItems(prevItems => {
        const newItems = [...prevItems];
        if (!newItems[index]) return prevItems;
        
        const currentItem = newItems[index];
        
        if (field === 'productId') {
            (currentItem as any)[field] = value;
            if (value) {
                const confirmedReceipts = goodsReceipts
                    .filter(note => note.status === DocumentStatus.CONFIRMED)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                let lastPrice = 0;
                for (const receipt of confirmedReceipts) {
                    const item = receipt.items.find(i => i.productId === value);
                    if (item) {
                        lastPrice = item.price;
                        break;
                    }
                }
                currentItem.price = lastPrice;
            } else {
                currentItem.price = 0;
            }
        } else if (field === 'validDate') {
            (currentItem as any)[field] = value;
        } else {
            (currentItem as any)[field] = parseFloat(String(value).replace(/\s/g, '')) || 0;
        }

        // Auto-add new row logic
        if (field === 'productId' && value && index === prevItems.length - 1) {
            const maxBatchInForm = newItems.reduce((max, item) => {
                const num = parseInt(item.batchId, 10);
                return !isNaN(num) && num > max ? num : max;
            }, 0);
            const validDate = new Date();
            validDate.setMonth(validDate.getMonth() + 6);
            newItems.push({
                productId: '',
                quantity: 0,
                price: 0,
                batchId: (maxBatchInForm + 1).toString(),
                validDate: formatDate(validDate)
            });
        }
        
        return newItems;
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };
  
  const handleFormSubmit = (e: React.FormEvent, action: 'save' | 'save_and_confirm' = 'save') => {
    e.preventDefault();

    if (!formData.supplier_id) {
        alert("Iltimos, yetkazib beruvchini tanlang.");
        return;
    }

    if (!formData.warehouse_id) {
        alert("Iltimos, omborni tanlang.");
        return;
    }
    
    // Filter out incomplete items. This will ignore the empty row that's auto-added.
    const finalItems = items.filter(item => item.productId && item.quantity > 0).map(item => {
        if (appMode === 'lite' && !item.validDate) {
            const validDate = new Date();
            validDate.setFullYear(validDate.getFullYear() + 1);
            return { ...item, validDate: formatDate(validDate) };
        }
        return item;
    });

    // Check if there are any valid items left.
    if (finalItems.length === 0) {
        alert("Iltimos, saqlash uchun kamida bitta to'liq mahsulot qatorini kiriting.");
        return;
    }

    // Perform validation on the remaining items.
    if(finalItems.some(item => item.price < 0)) {
        alert("Mahsulot narxi manfiy bo'lishi mumkin emas.");
        return;
    }

    if (appMode === 'pro' && finalItems.some(item => !item.validDate)) {
        alert("Iltimos, har bir mahsulot uchun yaroqlilik muddatini kiriting.");
        return;
    }
    
    onSubmit({ ...formData, date: new Date(formData.date).toISOString(), items: finalItems }, action);
  };
  
  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [items]);

  const handleProductFormSubmit = (productData: Omit<Product, 'id'> | Product) => {
    if ('id' in productData) {
        updateProduct(productData);
    } else {
        const newProduct = addProduct(productData);
        if (productModalState.index !== null) {
            const newItems = [...items];
            newItems[productModalState.index].productId = newProduct.id;
            setItems(newItems);
        }
    }
    setProductModalState({isOpen: false, product: null, index: null});
  };
  
  const handleSupplierFormSubmit = (supplierData: Omit<Supplier, 'id'> | Supplier) => {
    if ('id' in supplierData) {
        updateSupplier(supplierData);
    } else {
        const newSupplier = addSupplier(supplierData);
        setFormData(prev => ({...prev, supplier_id: newSupplier.id}));
    }
    setSupplierModalState({isOpen: false, supplier: null});
  };

  const handleWarehouseFormSubmit = (warehouseData: Omit<Warehouse, 'id'> | Warehouse) => {
    if ('id' in warehouseData) {
        updateWarehouse(warehouseData);
    } else {
        const newWarehouse = addWarehouse(warehouseData as Omit<Warehouse, 'id'>);
        setFormData(prev => ({...prev, warehouse_id: newWarehouse.id}));
    }
    setWarehouseModalState({isOpen: false, warehouse: null});
  };

  const handleEditProductClick = (index: number) => {
    const item = items[index];
    if (!item.productId) return;
    const productToEdit = products.find(p => p.id === item.productId);
    if (productToEdit) {
        setProductModalState({ isOpen: true, product: productToEdit, index });
    }
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={note ? "Kirim hujjatini tahrirlash" : "Yangi kirim hujjati"} size="fullscreen" closeOnOverlayClick={false}>
        <form onSubmit={(e) => handleFormSubmit(e, 'save')} className="flex flex-col h-full">
          {/* Header */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b border-slate-200 flex-shrink-0">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-slate-700 mb-1">Sana</label>
              <input type="date" name="date" id="date" value={formData.date} onChange={handleHeaderChange} required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg" />
            </div>
            <div className="flex items-end gap-1">
                <div className="flex-grow">
                    <label htmlFor="supplier_id" className="block text-sm font-medium text-slate-700 mb-1">Yetkazib beruvchi</label>
                    <select name="supplier_id" id="supplier_id" value={formData.supplier_id} onChange={handleHeaderChange} required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg">
                      <option value="" disabled>Tanlang...</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                <button type="button" onClick={() => setSupplierModalState({ isOpen: true, supplier: null })} title="Yangi qo'shish" className="p-2.5 bg-slate-200 rounded-lg hover:bg-slate-300 transition-colors"><PlusIcon className="h-5 w-5"/></button>
                <button 
                  type="button" 
                  onClick={() => {
                    const supplierToEdit = suppliers.find(s => s.id === formData.supplier_id);
                    if (supplierToEdit) {
                        setSupplierModalState({ isOpen: true, supplier: supplierToEdit });
                    }
                  }} 
                  disabled={!formData.supplier_id}
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

          {/* Items Table */}
          <div className="flex-1 py-4">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-2 py-2 text-left font-medium text-slate-600" style={{width: appMode === 'pro' ? '35%' : '50%'}}>
                    Mahsulot
                  </th>
                  <th className="px-2 py-2 text-left font-medium text-slate-600">Miqdor</th>
                  <th className="px-2 py-2 text-left font-medium text-slate-600">Narx</th>
                  {appMode === 'pro' && <th className="px-2 py-2 text-left font-medium text-slate-600">Yaroqlilik mudd.</th>}
                  <th className="px-2 py-2 text-left font-medium text-slate-600">Summa</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-1">
                      <div className="flex items-center gap-1">
                          <div className="flex-grow">
                              <SearchableSelect
                                  ref={index === 0 ? firstProductInputRef : undefined}
                                  options={productOptions}
                                  value={item.productId}
                                  onChange={(value) => {
                                      if (value !== null) {
                                          handleItemChange(index, 'productId', value);
                                      }
                                  }}
                                  onAddNew={() => setProductModalState({ isOpen: true, product: null, index })}
                                  placeholder="Mahsulotni qidiring..."
                                  addNewLabel="... Yangi mahsulot qo'shish"
                              />
                          </div>
                          <button 
                              type="button" 
                              onClick={() => handleEditProductClick(index)} 
                              disabled={!item.productId}
                              title="Tahrirlash"
                              className="p-2 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                              <EditIcon className="h-5 w-5"/>
                          </button>
                      </div>
                    </td>
                    <td className="p-1">
                        <input 
                            type="text" 
                            value={item.quantity === 0 ? '' : formatNumberWithSpaces(item.quantity)} 
                            onChange={e => {
                                const cleanedValue = e.target.value.replace(/\s/g, '');
                                if (/^\d*\.?\d*$/.test(cleanedValue) || cleanedValue === '') {
                                    handleItemChange(index, 'quantity', cleanedValue);
                                }
                            }}
                            placeholder="0"
                            className="w-full px-3 py-2 border border-slate-300 rounded-md text-right" 
                            required 
                        />
                    </td>
                    <td className="p-1">
                        <input 
                            type="text" 
                            value={item.price === 0 ? '' : formatNumberWithSpaces(item.price)}
                            onChange={e => {
                                const cleanedValue = e.target.value.replace(/\s/g, '');
                                if (/^\d*\.?\d*$/.test(cleanedValue) || cleanedValue === '') {
                                    handleItemChange(index, 'price', cleanedValue);
                                }
                            }}
                            placeholder="0"
                            className="w-full px-3 py-2 border border-slate-300 rounded-md text-right" 
                            required 
                        />
                    </td>
                    {appMode === 'pro' && <td className="p-1"><input type="date" value={item.validDate} onChange={e => handleItemChange(index, 'validDate', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md" required /></td>}
                    <td className="p-1 font-mono">{formatCurrency(item.quantity * item.price)}</td>
                    <td className="p-1 text-center">
                      <button type="button" onClick={() => handleRemoveItem(index)} className="text-red-500 hover:text-red-700 p-2"><TrashIcon className="h-5 w-5"/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Footer */}
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
                            onChange={e => {
                                const cleanedValue = e.target.value.replace(/\s/g, '');
                                if (/^\d*\.?\d*$/.test(cleanedValue) || cleanedValue === '') {
                                    handleHeaderChange({
                                        target: { name: 'paid_amount', value: cleanedValue }
                                    } as React.ChangeEvent<HTMLInputElement>);
                                }
                            }}
                            placeholder="0"
                            className="w-40 px-3 py-2 border border-slate-300 rounded-md text-right"
                        />
                    </div>
                    {formData.paid_amount > 0 && (
                         <div className="flex items-center gap-2">
                            <label htmlFor="payment_method" className="text-sm font-medium text-slate-700">To'lov usuli:</label>
                            <select 
                                name="payment_method" 
                                id="payment_method" 
                                value={formData.payment_method} 
                                onChange={handleHeaderChange} 
                                className="w-40 px-3 py-2 border border-slate-300 rounded-md"
                            >
                               {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                    )}
                </div>
                
                <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className="text-sm text-slate-600">Jami summa: </span>
                      <span className="text-xl font-bold text-slate-800 font-mono">{formatCurrency(totalAmount)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                         <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200">Bekor qilish</button>
                        <button type="submit" className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700">Saqlash</button>
                        <button 
                            type="button" 
                            onClick={(e) => handleFormSubmit(e, 'save_and_confirm')}
                            className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700"
                        >
                            Saqlash va Tasdiqlash
                        </button>
                    </div>
                </div>
            </div>
          </div>
        </form>
      </Modal>

      <ProductFormModal
        isOpen={productModalState.isOpen}
        onClose={() => setProductModalState({isOpen: false, product: null, index: null})}
        onSubmit={handleProductFormSubmit}
        product={productModalState.product}
        products={products}
      />
      <SupplierFormModal
        isOpen={supplierModalState.isOpen}
        onClose={() => setSupplierModalState({isOpen: false, supplier: null})}
        onSubmit={handleSupplierFormSubmit}
        supplier={supplierModalState.supplier}
        isInnUnique={isInnUnique}
      />
      <WarehouseFormModal
        isOpen={warehouseModalState.isOpen}
        onClose={() => setWarehouseModalState({isOpen: false, warehouse: null})}
        onSubmit={handleWarehouseFormSubmit}
        warehouse={warehouseModalState.warehouse}
      />
    </>
  );
};
