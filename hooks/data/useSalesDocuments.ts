// FIX: Import Dispatch and SetStateAction from 'react' to resolve namespace error.
import { useState, Dispatch, SetStateAction } from 'react';
import { SalesInvoice, ClientPayment, Stock, Product, Dish, Recipe, DocumentStatus, PaymentMethod, ClientPaymentLink, SalesInvoiceItem } from '../../types';

const formatCurrency = (amount: number) => new Intl.NumberFormat('uz-UZ').format(amount);

interface useSalesDocumentsProps {
    initialData: {
        salesInvoices: SalesInvoice[];
        clientPayments: ClientPayment[];
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
        const confirmedNote = addSalesInvoice(noteData);
        confirmSalesInvoice(confirmedNote.id);
        return salesInvoices.find(inv => inv.id === confirmedNote.id)!;
    };

    const updateAndConfirmSalesInvoice = (updatedNote: SalesInvoice) => {
        updateSalesInvoice(updatedNote);
        confirmSalesInvoice(updatedNote.id);
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

    return {
        salesInvoices, setSalesInvoices, addSalesInvoice, updateSalesInvoice, deleteSalesInvoice, confirmSalesInvoice, addAndConfirmSalesInvoice, updateAndConfirmSalesInvoice,
        clientPayments, setClientPayments, addClientPayment,
        getClientInvoiceTotal,
    };
};