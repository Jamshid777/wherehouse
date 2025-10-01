// FIX: Import Dispatch and SetStateAction from 'react' to resolve namespace error.
import { useState, Dispatch, SetStateAction } from 'react';
import { GoodsReceiptNote, GoodsReturnNote, Payment, PriceAdjustmentNote, Stock, DocumentStatus, PaymentMethod, PaymentLink, GoodsReceiptItem, GoodsReturnItem } from '../../types';

const formatCurrency = (amount: number) => new Intl.NumberFormat('uz-UZ').format(amount);

interface useSupplierDocumentsProps {
    initialData: {
        goodsReceipts: GoodsReceiptNote[];
        goodsReturns: GoodsReturnNote[];
        payments: Payment[];
        priceAdjustments: PriceAdjustmentNote[];
    };
    stock: Stock[];
    // FIX: Use imported Dispatch and SetStateAction types instead of React namespace.
    setStock: Dispatch<SetStateAction<Stock[]>>;
    consumeStockByFIFO: (filter: { productId?: string, dishId?: string }, warehouseId: string, quantityToConsume: number, currentStock: Stock[]) => { updatedStock: Stock[], consumedCost: number, consumedBatches: any[] };
}

export const useSupplierDocuments = ({ initialData, stock, setStock, consumeStockByFIFO }: useSupplierDocumentsProps) => {
  const [goodsReceipts, setGoodsReceipts] = useState<GoodsReceiptNote[]>(initialData.goodsReceipts);
  const [goodsReturns, setGoodsReturns] = useState<GoodsReturnNote[]>(initialData.goodsReturns);
  const [payments, setPayments] = useState<Payment[]>(initialData.payments);
  const [priceAdjustments, setPriceAdjustments] = useState<PriceAdjustmentNote[]>(initialData.priceAdjustments);

  const getNoteTotal = (items: GoodsReceiptItem[]) => items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Goods Receipt Operations
  const addGoodsReceipt = (note: Omit<GoodsReceiptNote, 'id' | 'status' | 'doc_number'>) => {
    const doc_number = `K-${(goodsReceipts.length + 1).toString().padStart(4, '0')}`;
    const newNote: GoodsReceiptNote = { ...note, id: `grn${Date.now()}`, status: DocumentStatus.DRAFT, doc_number };
    setGoodsReceipts(prev => [newNote, ...prev]);
    return newNote;
  };

  const updateGoodsReceipt = (updatedNote: GoodsReceiptNote) => {
    setGoodsReceipts(prev => {
        const noteIndex = prev.findIndex(n => n.id === updatedNote.id);
        if (noteIndex === -1 || prev[noteIndex].status === DocumentStatus.CONFIRMED) {
            alert("Tasdiqlangan yoki mavjud bo'lmagan hujjatni o'zgartirib bo'lmaydi.");
            return prev;
        }
        return prev.map(n => n.id === updatedNote.id ? updatedNote : n);
    });
  };

  const deleteGoodsReceipt = (noteId: string) => {
    setGoodsReceipts(prev => prev.find(n => n.id === noteId)?.status === DocumentStatus.CONFIRMED ? prev : prev.filter(n => n.id !== noteId));
  };
  
  const confirmGoodsReceipt = (noteId: string) => {
    const note = goodsReceipts.find(n => n.id === noteId);
    if (!note || note.status === DocumentStatus.CONFIRMED) return;
    
    if (note.paid_amount > 0) {
        const newPayment: Payment = { id: `pay${Date.now()}`, doc_number: `P-${(payments.length + 1).toString().padStart(4, '0')}`, date: note.date, supplier_id: note.supplier_id, amount: note.paid_amount, payment_method: note.payment_method || PaymentMethod.CASH, links: [{ grnId: note.id, amountApplied: note.paid_amount }], comment: `"${note.doc_number}" hujjat uchun dastlabki to'lov` };
        setPayments(prev => [newPayment, ...prev]);
    }

    const updatedItems = note.items.map((item, index) => ({ ...item, batchId: `${note.id}-i${index}` }));
    
    setStock(prevStock => {
        const newBatches = updatedItems.map(item => ({ batchId: item.batchId, productId: item.productId, warehouseId: note.warehouse_id, quantity: item.quantity, cost: item.price, receiptDate: note.date, validDate: item.validDate }));
        return [...prevStock, ...newBatches];
    });
    
    setGoodsReceipts(prev => prev.map(n => n.id === noteId ? { ...n, items: updatedItems, status: DocumentStatus.CONFIRMED } : n));
  };

  const addAndConfirmGoodsReceipt = (noteData: Omit<GoodsReceiptNote, 'id' | 'status' | 'doc_number'>) => {
    const doc_number = `K-${(goodsReceipts.length + 1).toString().padStart(4, '0')}`;
    const id = `grn${Date.now()}`;
    const newNote: GoodsReceiptNote = { ...noteData, id, status: DocumentStatus.CONFIRMED, doc_number, items: noteData.items.map((item, index) => ({ ...item, batchId: `${id}-i${index}` })) };

    if (newNote.paid_amount > 0) {
        const newPayment: Payment = { id: `pay${Date.now()}`, doc_number: `P-${(payments.length + 1).toString().padStart(4, '0')}`, date: newNote.date, supplier_id: newNote.supplier_id, amount: newNote.paid_amount, payment_method: newNote.payment_method || PaymentMethod.CASH, links: [{ grnId: newNote.id, amountApplied: newNote.paid_amount }], comment: `"${newNote.doc_number}" hujjat uchun dastlabki to'lov` };
        setPayments(prev => [newPayment, ...prev]);
    }
    
    setStock(prevStock => {
        const newBatches = newNote.items.map(item => ({ batchId: item.batchId, productId: item.productId, warehouseId: newNote.warehouse_id, quantity: item.quantity, cost: item.price, receiptDate: newNote.date, validDate: item.validDate }));
        return [...prevStock, ...newBatches];
    });

    setGoodsReceipts(prev => [newNote, ...prev]);
    return newNote;
  };
  
  const updateAndConfirmGoodsReceipt = (updatedNote: GoodsReceiptNote) => {
    if (goodsReceipts.find(n => n.id === updatedNote.id)?.status === DocumentStatus.CONFIRMED) return;
    const noteWithUpdatedItems: GoodsReceiptNote = { ...updatedNote, items: updatedNote.items.map((item, index) => ({ ...item, batchId: `${updatedNote.id}-i${index}` })) };
    
    if (noteWithUpdatedItems.paid_amount > 0) {
        const newPayment: Payment = { id: `pay${Date.now()}`, doc_number: `P-${(payments.length + 1).toString().padStart(4, '0')}`, date: noteWithUpdatedItems.date, supplier_id: noteWithUpdatedItems.supplier_id, amount: noteWithUpdatedItems.paid_amount, payment_method: noteWithUpdatedItems.payment_method || PaymentMethod.CASH, links: [{ grnId: noteWithUpdatedItems.id, amountApplied: noteWithUpdatedItems.paid_amount }], comment: `"${noteWithUpdatedItems.doc_number}" hujjat uchun dastlabki to'lov` };
        setPayments(prev => [newPayment, ...prev]);
    }
    
    setStock(prevStock => {
        const newBatches = noteWithUpdatedItems.items.map(item => ({ batchId: item.batchId, productId: item.productId, warehouseId: noteWithUpdatedItems.warehouse_id, quantity: item.quantity, cost: item.price, receiptDate: noteWithUpdatedItems.date, validDate: item.validDate }));
        return [...prevStock, ...newBatches];
    });
    
    setGoodsReceipts(prev => prev.map(n => n.id === noteWithUpdatedItems.id ? { ...noteWithUpdatedItems, status: DocumentStatus.CONFIRMED } : n));
  };

  // Goods Return Operations
  const addGoodsReturn = (note: Omit<GoodsReturnNote, 'id' | 'status' | 'doc_number'>) => {
    const doc_number = `Q-${(goodsReturns.length + 1).toString().padStart(4, '0')}`;
    const newNote = { ...note, id: `grtn${Date.now()}`, status: DocumentStatus.DRAFT, doc_number };
    setGoodsReturns(prev => [newNote, ...prev]);
    return newNote;
  };

  const updateGoodsReturn = (updatedNote: GoodsReturnNote) => {
    setGoodsReturns(prev => prev.map(n => n.id === updatedNote.id && n.status !== DocumentStatus.CONFIRMED ? updatedNote : n));
  };

  const confirmGoodsReturn = (noteId: string) => {
    const note = goodsReturns.find(n => n.id === noteId);
    if (!note || note.status === DocumentStatus.CONFIRMED) return;

    let tempStock = JSON.parse(JSON.stringify(stock));
    const updatedItems: GoodsReturnItem[] = [];

    note.items.forEach(item => {
        const { updatedStock, consumedCost, consumedBatches } = consumeStockByFIFO({ productId: item.productId }, note.warehouse_id, item.quantity, tempStock);
        tempStock = updatedStock;
        updatedItems.push({ ...item, cost: consumedCost, consumedBatches });
    });
    
    setStock(tempStock);
    setGoodsReturns(prev => prev.map(n => n.id === noteId ? { ...n, items: updatedItems, status: DocumentStatus.CONFIRMED } : n));
  };
  
  // Payment Operations
  const addPayment = (paymentData: Omit<Payment, 'id' | 'doc_number' | 'links'>) => {
    const paymentLinks: PaymentLink[] = [];
    const updatesToApply = new Map<string, number>();
    let amountToApply = paymentData.amount;
    const unpaidGrns = goodsReceipts.filter(g => g.supplier_id === paymentData.supplier_id && g.status === DocumentStatus.CONFIRMED && (getNoteTotal(g.items) - g.paid_amount) > 0.01).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    for (const grn of unpaidGrns) {
        if (amountToApply <= 0) break;
        const dueAmount = getNoteTotal(grn.items) - grn.paid_amount;
        const amountToCredit = Math.min(amountToApply, dueAmount);
        updatesToApply.set(grn.id, amountToCredit);
        paymentLinks.push({ grnId: grn.id, amountApplied: amountToCredit });
        amountToApply -= amountToCredit;
    }
    
    const newPayment: Payment = { ...paymentData, id: `pay${Date.now()}`, doc_number: `P-${(payments.length + 1).toString().padStart(4, '0')}`, links: paymentLinks };
    setPayments(prev => [newPayment, ...prev]);
    setGoodsReceipts(prev => prev.map(r => updatesToApply.has(r.id) ? { ...r, paid_amount: r.paid_amount + updatesToApply.get(r.id)! } : r));
  };

  const addDirectPaymentForNote = (noteId: string, amount: number, paymentMethod: PaymentMethod, comment: string) => {
    const note = goodsReceipts.find(n => n.id === noteId);
    if (!note || note.status !== DocumentStatus.CONFIRMED) throw new Error("Faqat tasdiqlangan hujjatlar uchun to'lov qilish mumkin.");
    const dueAmount = getNoteTotal(note.items) - note.paid_amount;
    if (amount <= 0 || amount > dueAmount + 0.01) throw new Error(`To'lov summasi noto'g'ri.`);
    
    const newPayment: Payment = { id: `pay${Date.now()}`, doc_number: `P-${(payments.length + 1).toString().padStart(4, '0')}`, date: new Date().toISOString(), supplier_id: note.supplier_id, amount: amount, payment_method: paymentMethod, links: [{ grnId: noteId, amountApplied: amount }], comment: comment || `"${note.doc_number}" hujjat uchun to'lov` };
    setPayments(prev => [newPayment, ...prev]);
    setGoodsReceipts(prev => prev.map(r => r.id === noteId ? { ...r, paid_amount: r.paid_amount + amount } : r));
  };
    
  // Price Adjustment Operations
  const addPriceAdjustmentNote = (note: Omit<PriceAdjustmentNote, 'id' | 'status' | 'doc_number'>) => {
    const doc_number = `PK-${(priceAdjustments.length + 1).toString().padStart(4, '0')}`;
    const newNote: PriceAdjustmentNote = { ...note, id: `pa${Date.now()}`, status: DocumentStatus.DRAFT, doc_number };
    setPriceAdjustments(prev => [newNote, ...prev]);
    return newNote;
  };
  
  const confirmPriceAdjustmentNote = (noteId: string) => {
    const note = priceAdjustments.find(n => n.id === noteId);
    if (!note || note.status === DocumentStatus.CONFIRMED) return;
    setStock(prev => {
        const newStock = JSON.parse(JSON.stringify(prev));
        note.items.forEach(item => { const batch = newStock.find((s: Stock) => s.batchId === item.batchId); if (batch) batch.cost = item.newPrice; });
        return newStock;
    });
    setPriceAdjustments(prev => prev.map(n => n.id === noteId ? { ...n, status: DocumentStatus.CONFIRMED } : n));
  };

  const addAndConfirmPriceAdjustmentNote = (noteData: Omit<PriceAdjustmentNote, 'id' | 'status' | 'doc_number'>) => {
    const doc_number = `PK-${(priceAdjustments.length + 1).toString().padStart(4, '0')}`;
    const newNote: PriceAdjustmentNote = { ...noteData, id: `pa${Date.now()}`, status: DocumentStatus.CONFIRMED, doc_number };
    setStock(prev => {
        const newStock = JSON.parse(JSON.stringify(prev));
        newNote.items.forEach(item => { const batch = newStock.find((s: Stock) => s.batchId === item.batchId); if (batch) batch.cost = item.newPrice; });
        return newStock;
    });
    setPriceAdjustments(prev => [newNote, ...prev]);
    return newNote;
  };

  const getNextBatchNumber = () => Math.max(0, ...goodsReceipts.flatMap(n => n.items).map(i => parseInt(i.batchId, 10)).filter(num => !isNaN(num))) + 1;


  return {
    goodsReceipts, setGoodsReceipts, goodsReturns, setGoodsReturns, payments, setPayments, priceAdjustments, setPriceAdjustments,
    getNoteTotal, addGoodsReceipt, updateGoodsReceipt, deleteGoodsReceipt, confirmGoodsReceipt, addAndConfirmGoodsReceipt, updateAndConfirmGoodsReceipt,
    addGoodsReturn, updateGoodsReturn, confirmGoodsReturn, addPayment, addDirectPaymentForNote,
    addPriceAdjustmentNote, confirmPriceAdjustmentNote, addAndConfirmPriceAdjustmentNote, getNextBatchNumber
  };
};