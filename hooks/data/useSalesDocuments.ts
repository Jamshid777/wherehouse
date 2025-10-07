// FIX: Import Dispatch and SetStateAction from 'react' to resolve namespace error.
import { useState, Dispatch, SetStateAction } from 'react';
import { SalesInvoice, ClientPayment, Stock, Product, Dish, Recipe, DocumentStatus, PaymentMethod, ClientPaymentLink, SalesInvoiceItem, SalesReturnNote, SalesReturnReason } from '../../types';

const formatCurrency = (amount: number) => new Intl.NumberFormat('uz-UZ').format(amount);

interface useSalesDocumentsProps {
    initialData: {
        salesInvoices: SalesInvoice[];
        clientPayments: ClientPayment[];
        salesReturns?: SalesReturnNote[];
    };
    stock: Stock[];
    // FIX: Use imported Dispatch and SetStateAction types instead of React namespace.
    setStock: Dispatch<SetStateAction<Stock[]>>;
    products: Product[];
    dishes: Dish[];
    recipes: Recipe[];
    consumeStockByFIFO: (filter: { productId?: string, dishId?: string }, warehouseId: string, quantityToConsume: number, currentStock: Stock[]) => { updatedStock: Stock[], consumedCost: number, consumedBatches: any[] };
}

export const useSalesDocuments = ({ initialData, stock, setStock, products, dishes, recipes, consumeStockByFIFO }: useSalesDocumentsProps) => {
    const [salesInvoices, setSalesInvoices] = useState<SalesInvoice[]>(initialData.salesInvoices);
    const [clientPayments, setClientPayments] = useState<ClientPayment[]>(initialData.clientPayments);
    const [salesReturns, setSalesReturns] = useState<SalesReturnNote[]>(initialData.salesReturns || []);

    const getProduct = (productId: string) => products.find(p => p.id === productId);
    const getTotalStockQuantity = (productId: string, warehouseId: string) => stock.filter(s => s.productId === productId && s.warehouseId === warehouseId).reduce((sum, s) => sum + s.quantity, 0);

    const getClientInvoiceTotal = (items: SalesInvoiceItem[]) => items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const addSalesInvoice = (note: Omit<SalesInvoice, 'id' | 'status' | 'doc_number'>): SalesInvoice => {
        const doc_number = `S-${(salesInvoices.length + 1).toString().padStart(4, '0')}`;
        const newNote: SalesInvoice = { ...note, id: `si${Date.now()}`, status: DocumentStatus.DRAFT, doc_number };
        setSalesInvoices(prev => [newNote, ...prev]);
        return newNote;
    };
    const updateSalesInvoice = (updatedNote: SalesInvoice) => {
        setSalesInvoices(prev => prev.map(n => n.id === updatedNote.id && n.status !== DocumentStatus.CONFIRMED ? updatedNote : n));
    };
    const deleteSalesInvoice = (noteId: string) => {
        setSalesInvoices(prev => prev.find(n => n.id === noteId)?.status === DocumentStatus.CONFIRMED ? prev : prev.filter(n => n.id !== noteId));
    };

    const confirmSalesInvoice = (noteId: string) => {
        const note = salesInvoices.find(n => n.id === noteId);
        if (!note || note.status === DocumentStatus.CONFIRMED) return;
        
        if (note.paid_amount > 0) {
            const newPayment: ClientPayment = { id: `cpay${Date.now()}`, doc_number: `CP-${(clientPayments.length + 1).toString().padStart(4, '0')}`, date: note.date, client_id: note.client_id, amount: note.paid_amount, payment_method: note.payment_method || PaymentMethod.CASH, links: [{ invoiceId: note.id, amountApplied: note.paid_amount }], comment: `"${note.doc_number}" hujjat uchun dastlabki to'lov`};
            setClientPayments(prev => [newPayment, ...prev]);
        }
        
        let tempStock = JSON.parse(JSON.stringify(stock));
        const finalInvoiceItems: SalesInvoiceItem[] = [];

        for (const item of note.items) {
            const { updatedStock, consumedCost } = consumeStockByFIFO(
                { dishId: item.dishId },
                note.warehouse_id,
                item.quantity,
                tempStock
            );
            tempStock = updatedStock;
            finalInvoiceItems.push({ ...item, cost: consumedCost });
        }

        setStock(tempStock);
        setSalesInvoices(prev => prev.map(n => n.id === noteId ? { ...n, items: finalInvoiceItems, status: DocumentStatus.CONFIRMED } : n));
    };
    
    const addAndConfirmSalesInvoice = (noteData: Omit<SalesInvoice, 'id' | 'status' | 'doc_number'>) => {
        const doc_number = `S-${(salesInvoices.length + 1).toString().padStart(4, '0')}`;
        const newNoteId = `si${Date.now()}`;
    
        if (noteData.paid_amount > 0) {
            const newPayment: ClientPayment = {
                id: `cpay${Date.now()}`,
                doc_number: `CP-${(clientPayments.length + 1).toString().padStart(4, '0')}`,
                date: noteData.date,
                client_id: noteData.client_id,
                amount: noteData.paid_amount,
                payment_method: noteData.payment_method || PaymentMethod.CASH,
                links: [{ invoiceId: newNoteId, amountApplied: noteData.paid_amount }],
                comment: `"${doc_number}" hujjat uchun dastlabki to'lov`
            };
            setClientPayments(prev => [newPayment, ...prev]);
        }

        let tempStock = JSON.parse(JSON.stringify(stock));
        const finalInvoiceItems: SalesInvoiceItem[] = [];

        for (const item of noteData.items) {
            const { updatedStock, consumedCost } = consumeStockByFIFO(
                { dishId: item.dishId },
                noteData.warehouse_id,
                item.quantity,
                tempStock
            );
            tempStock = updatedStock;
            finalInvoiceItems.push({ ...item, cost: consumedCost });
        }

        const finalConfirmedNote: SalesInvoice = {
            ...noteData,
            id: newNoteId,
            doc_number,
            items: finalInvoiceItems,
            status: DocumentStatus.CONFIRMED
        };

        setStock(tempStock);
        setSalesInvoices(prev => [finalConfirmedNote, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    };

    const updateAndConfirmSalesInvoice = (updatedNote: SalesInvoice) => {
        const noteIndex = salesInvoices.findIndex(n => n.id === updatedNote.id);
        if (noteIndex === -1 || salesInvoices[noteIndex].status === DocumentStatus.CONFIRMED) {
            throw new Error("Hujjat topilmadi yoki allaqachon tasdiqlangan.");
        }

        if (updatedNote.paid_amount > 0) {
             const newPayment: ClientPayment = {
                id: `cpay${Date.now()}`,
                doc_number: `CP-${(clientPayments.length + 1).toString().padStart(4, '0')}`,
                date: updatedNote.date,
                client_id: updatedNote.client_id,
                amount: updatedNote.paid_amount,
                payment_method: updatedNote.payment_method || PaymentMethod.CASH,
                links: [{ invoiceId: updatedNote.id, amountApplied: updatedNote.paid_amount }],
                comment: `"${updatedNote.doc_number}" hujjat uchun dastlabki to'lov`
            };
            setClientPayments(prev => [newPayment, ...prev]);
        }

        let tempStock = JSON.parse(JSON.stringify(stock));
        const finalInvoiceItems: SalesInvoiceItem[] = [];

        for (const item of updatedNote.items) {
            const { updatedStock, consumedCost } = consumeStockByFIFO(
                { dishId: item.dishId },
                updatedNote.warehouse_id,
                item.quantity,
                tempStock
            );
            tempStock = updatedStock;
            finalInvoiceItems.push({ ...item, cost: consumedCost });
        }

        const finalConfirmedNote: SalesInvoice = { ...updatedNote, items: finalInvoiceItems, status: DocumentStatus.CONFIRMED };

        setStock(tempStock);
        setSalesInvoices(prev => prev.map(n => n.id === finalConfirmedNote.id ? finalConfirmedNote : n));
    };

    const addClientPayment = (paymentData: Omit<ClientPayment, 'id' | 'doc_number' | 'links'>) => {
        const paymentLinks: ClientPaymentLink[] = [];
        let amountToApply = paymentData.amount;
        const unpaidInvoices = salesInvoices.filter(inv => inv.client_id === paymentData.client_id && inv.status === DocumentStatus.CONFIRMED && (getClientInvoiceTotal(inv.items) - inv.paid_amount) > 0.01).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const updatesToApply = new Map<string, number>();

        for (const inv of unpaidInvoices) {
            if (amountToApply <= 0) break;
            const dueAmount = getClientInvoiceTotal(inv.items) - inv.paid_amount;
            const amountToCredit = Math.min(amountToApply, dueAmount);
            updatesToApply.set(inv.id, amountToCredit);
            paymentLinks.push({ invoiceId: inv.id, amountApplied: amountToCredit });
            amountToApply -= amountToCredit;
        }
        
        const newPayment: ClientPayment = { ...paymentData, id: `cpay${Date.now()}`, doc_number: `CP-${(clientPayments.length + 1).toString().padStart(4, '0')}`, links: paymentLinks };
        setClientPayments(prev => [newPayment, ...prev]);
        setSalesInvoices(prev => prev.map(inv => updatesToApply.has(inv.id) ? { ...inv, paid_amount: inv.paid_amount + updatesToApply.get(inv.id)! } : inv));
    };

    // Sales Return Operations
    const addSalesReturn = (note: Omit<SalesReturnNote, 'id' | 'status' | 'doc_number'>): SalesReturnNote => {
        const doc_number = `SQ-${(salesReturns.length + 1).toString().padStart(4, '0')}`;
        const newNote: SalesReturnNote = { ...note, id: `sret${Date.now()}`, status: DocumentStatus.DRAFT, doc_number };
        setSalesReturns(prev => [newNote, ...prev]);
        return newNote;
    };
    const updateSalesReturn = (updatedNote: SalesReturnNote) => {
        setSalesReturns(prev => prev.map(n => n.id === updatedNote.id && n.status !== DocumentStatus.CONFIRMED ? updatedNote : n));
    };
    const deleteSalesReturn = (noteId: string) => {
        setSalesReturns(prev => prev.find(n => n.id === noteId)?.status === DocumentStatus.CONFIRMED ? prev : prev.filter(n => n.id !== noteId));
    };
    const confirmSalesReturn = (noteId: string) => {
        const note = salesReturns.find(n => n.id === noteId);
        if (!note || note.status === DocumentStatus.CONFIRMED) return;

        switch (note.reason) {
            case SalesReturnReason.RETURN_TO_STOCK:
                const newStockItems: Stock[] = note.items.map(item => ({
                    batchId: `sret-${note.id}-${item.dishId}`,
                    dishId: item.dishId,
                    warehouseId: note.warehouse_id,
                    quantity: item.quantity,
                    cost: item.cost, // Use the cost from the original sale
                    receiptDate: note.date,
                }));
                setStock(prev => [...prev, ...newStockItems]);
                break;
            
            case SalesReturnReason.WRITE_OFF:
                // No stock change, this is a financial loss. P&L report will handle it.
                break;
        }

        setSalesReturns(prev => prev.map(n => n.id === noteId ? { ...n, status: DocumentStatus.CONFIRMED } : n));
    };


    return {
        salesInvoices, setSalesInvoices, addSalesInvoice, updateSalesInvoice, deleteSalesInvoice, confirmSalesInvoice, addAndConfirmSalesInvoice, updateAndConfirmSalesInvoice,
        clientPayments, setClientPayments, addClientPayment,
        salesReturns, setSalesReturns, addSalesReturn, updateSalesReturn, deleteSalesReturn, confirmSalesReturn,
        getClientInvoiceTotal,
    };
};