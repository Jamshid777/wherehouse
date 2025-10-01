// FIX: Import Dispatch and SetStateAction from 'react' to resolve namespace error.
import { useState, Dispatch, SetStateAction } from 'react';
// FIX: Add Dish to imports
import { WriteOffNote, InternalTransferNote, InventoryNote, Stock, Product, DocumentStatus, GoodsReceiptNote, Payment, WriteOffItem, WriteOffReason, GoodsReceiptItem, InternalTransferItem, Recipe, ProductionNote, ProductionProducedItem, Dish } from '../../types';

interface useInternalDocumentsProps {
    initialData: {
        writeOffs: WriteOffNote[];
        internalTransfers: InternalTransferNote[];
        inventoryNotes: InventoryNote[];
        productionNotes: ProductionNote[];
    };
    stock: Stock[];
    // FIX: Use imported Dispatch and SetStateAction types instead of React namespace.
    setStock: Dispatch<SetStateAction<Stock[]>>;
    products: Product[];
    goodsReceipts: GoodsReceiptNote[];
    // FIX: Use imported Dispatch and SetStateAction types instead of React namespace.
    setGoodsReceipts: Dispatch<SetStateAction<GoodsReceiptNote[]>>;
    payments: Payment[];
    // FIX: Use imported Dispatch and SetStateAction types instead of React namespace.
    setPayments: Dispatch<SetStateAction<Payment[]>>;
    consumeStockByFIFO: (filter: { productId?: string, dishId?: string }, warehouseId: string, quantityToConsume: number, currentStock: Stock[]) => { updatedStock: Stock[], consumedCost: number, consumedBatches: any[] };
    recipes: Recipe[];
    // FIX: Add dishes prop
    dishes: Dish[];
}

// FIX: Add dishes to destructuring
export const useInternalDocuments = ({ initialData, stock, setStock, products, goodsReceipts, setGoodsReceipts, payments, setPayments, consumeStockByFIFO, recipes, dishes }: useInternalDocumentsProps) => {
    const [writeOffs, setWriteOffs] = useState<WriteOffNote[]>(initialData.writeOffs);
    const [internalTransfers, setInternalTransfers] = useState<InternalTransferNote[]>(initialData.internalTransfers);
    const [inventoryNotes, setInventoryNotes] = useState<InventoryNote[]>(initialData.inventoryNotes);
    const [productionNotes, setProductionNotes] = useState<ProductionNote[]>(initialData.productionNotes);

    const getProduct = (productId: string) => products.find(p => p.id === productId);
    
    // Helper for Inventory
    const addAndConfirmGoodsReceipt = (noteData: Omit<GoodsReceiptNote, 'id' | 'status' | 'doc_number'>) => {
        const doc_number = `K-${(goodsReceipts.length + 1).toString().padStart(4, '0')}`;
        const id = `grn${Date.now()}`;
        const newNote: GoodsReceiptNote = { ...noteData, id, status: DocumentStatus.CONFIRMED, doc_number, items: noteData.items.map((item, index) => ({...item, batchId: `${id}-i${index}`})) };
        if (newNote.paid_amount > 0) {
            setPayments(prev => [...prev, { id: `pay${Date.now()}`, doc_number: `P-${(payments.length + 1).toString().padStart(4, '0')}`, date: newNote.date, supplier_id: newNote.supplier_id, amount: newNote.paid_amount, payment_method: newNote.payment_method!, links: [{ grnId: newNote.id, amountApplied: newNote.paid_amount }], comment: `"${newNote.doc_number}" uchun dastlabki to'lov`}]);
        }
        setStock(prevStock => [...prevStock, ...newNote.items.map(item => ({ batchId: item.batchId, productId: item.productId, warehouseId: newNote.warehouse_id, quantity: item.quantity, cost: item.price, receiptDate: newNote.date, validDate: item.validDate }))]);
        setGoodsReceipts(prev => [newNote, ...prev]);
        return newNote;
      };

    const addAndConfirmWriteOff = (noteData: Omit<WriteOffNote, 'id' | 'status' | 'doc_number'>) => {
        const doc_number = `CH-${(writeOffs.length + 1).toString().padStart(4, '0')}`;
        const newNote: WriteOffNote = { ...noteData, id: `wo${Date.now()}`, status: DocumentStatus.DRAFT, doc_number };
        let tempStock = JSON.parse(JSON.stringify(stock));
        const updatedItems: WriteOffItem[] = [];
        newNote.items.forEach(item => {
          const { updatedStock, consumedCost, consumedBatches } = consumeStockByFIFO({ productId: item.productId }, newNote.warehouse_id, item.quantity, tempStock);
          tempStock = updatedStock;
          updatedItems.push({ ...item, cost: consumedCost, consumedBatches });
        });
        setStock(tempStock);
        const confirmedNote = { ...newNote, items: updatedItems, status: DocumentStatus.CONFIRMED };
        setWriteOffs(prev => [confirmedNote, ...prev]);
        return confirmedNote;
    }

    // Write-Off Operations
    const addWriteOff = (note: Omit<WriteOffNote, 'id' | 'status' | 'doc_number'>) => {
        const doc_number = `CH-${(writeOffs.length + 1).toString().padStart(4, '0')}`;
        const newNote = { ...note, id: `wo${Date.now()}`, status: DocumentStatus.DRAFT, doc_number };
        setWriteOffs(prev => [newNote, ...prev]);
        return newNote;
    };
    const updateWriteOff = (updatedNote: WriteOffNote) => {
        setWriteOffs(prev => prev.map(n => n.id === updatedNote.id && n.status !== DocumentStatus.CONFIRMED ? updatedNote : n));
    };
    const deleteWriteOff = (noteId: string) => {
        setWriteOffs(prev => prev.find(n => n.id === noteId)?.status === DocumentStatus.CONFIRMED ? prev : prev.filter(n => n.id !== noteId));
    };
    const confirmWriteOff = (noteId: string) => {
        const note = writeOffs.find(n => n.id === noteId);
        if (!note || note.status === DocumentStatus.CONFIRMED) return;
        let tempStock = JSON.parse(JSON.stringify(stock));
        const updatedItems: WriteOffItem[] = [];
        note.items.forEach(item => {
            const { updatedStock, consumedCost, consumedBatches } = consumeStockByFIFO({ productId: item.productId }, note.warehouse_id, item.quantity, tempStock);
            tempStock = updatedStock;
            updatedItems.push({ ...item, cost: consumedCost, consumedBatches });
        });
        setStock(tempStock);
        setWriteOffs(prev => prev.map(n => n.id === noteId ? { ...n, items: updatedItems, status: DocumentStatus.CONFIRMED } : n));
    };

    // Internal Transfer Operations
    const addInternalTransfer = (note: Omit<InternalTransferNote, 'id' | 'status'| 'doc_number'>) => {
        const doc_number = `M-${(internalTransfers.length + 1).toString().padStart(4, '0')}`;
        const newNote = { ...note, id: `it${Date.now()}`, status: DocumentStatus.DRAFT, doc_number };
        setInternalTransfers(prev => [newNote, ...prev]);
        return newNote;
    };
    const updateInternalTransfer = (updatedNote: InternalTransferNote) => {
        setInternalTransfers(prev => prev.map(n => n.id === updatedNote.id && n.status !== DocumentStatus.CONFIRMED ? updatedNote : n));
    };
    const confirmInternalTransfer = (noteId: string) => {
        const note = internalTransfers.find(n => n.id === noteId);
        if (!note || note.status === DocumentStatus.CONFIRMED) return;
        let tempStock = JSON.parse(JSON.stringify(stock));
        note.items.forEach(item => {
            let qtyToTransfer = item.quantity;
            const productBatches = tempStock.filter((s: Stock) => s.productId === item.productId && s.warehouseId === note.from_warehouse_id).sort((a: Stock, b: Stock) => new Date(a.receiptDate).getTime() - new Date(b.receiptDate).getTime());
            if (productBatches.reduce((sum: number, b: Stock) => sum + b.quantity, 0) < qtyToTransfer) throw new Error(`"${getProduct(item.productId)?.name}" mahsuloti jo'natuvchi omborda yetarli emas.`);
            for (const batch of productBatches) {
                if (qtyToTransfer <= 0) break;
                const transferAmount = Math.min(qtyToTransfer, batch.quantity);
                batch.quantity -= transferAmount;
                qtyToTransfer -= transferAmount;
                tempStock.push({ batchId: `${batch.batchId}-t-${note.id}`, productId: item.productId, warehouseId: note.to_warehouse_id, quantity: transferAmount, cost: batch.cost, receiptDate: note.date, validDate: batch.validDate });
            }
        });
        setStock(tempStock.filter((s: Stock) => s.quantity > 0.001));
        setInternalTransfers(prev => prev.map(n => n.id === noteId ? { ...n, status: DocumentStatus.CONFIRMED } : n));
    };
    
    // Inventory Operations
    const addInventoryNote = (note: Omit<InventoryNote, 'id' | 'status' | 'doc_number'>) => {
        const doc_number = `I-${(inventoryNotes.length + 1).toString().padStart(4, '0')}`;
        const newNote = { ...note, id: `inv${Date.now()}`, status: DocumentStatus.DRAFT, doc_number };
        setInventoryNotes(prev => [newNote, ...prev]);
    };
    const updateInventoryNote = (updatedNote: InventoryNote) => {
        setInventoryNotes(prev => prev.map(n => n.id === updatedNote.id && n.status !== DocumentStatus.CONFIRMED ? updatedNote : n));
    };
    const confirmInventoryNote = (noteId: string) => {
        const note = inventoryNotes.find(n => n.id === noteId);
        if (!note || note.status === DocumentStatus.CONFIRMED) return;
        const surplusItems: GoodsReceiptItem[] = [];
        const shortageItems: WriteOffItem[] = [];
        note.items.forEach(item => {
            if (item.difference > 0) {
                const productStock = stock.filter(s => s.productId === item.productId && s.warehouseId === note.warehouse_id);
                const avgCost = productStock.length > 0 ? productStock.reduce((sum, s) => sum + s.quantity * s.cost, 0) / productStock.reduce((sum, s) => sum + s.quantity, 0) : 0;
                surplusItems.push({ productId: item.productId, quantity: item.difference, price: avgCost, batchId: 'system', validDate: new Date().toISOString() });
            } else if (item.difference < 0) {
                shortageItems.push({ productId: item.productId, quantity: Math.abs(item.difference), cost: 0 });
            }
        });
        if (surplusItems.length > 0) addAndConfirmGoodsReceipt({ date: note.date, supplier_id: 'SYSTEM', warehouse_id: note.warehouse_id, items: surplusItems, type: 'inventory_surplus', paid_amount: 0 });
        if (shortageItems.length > 0) addAndConfirmWriteOff({ date: note.date, warehouse_id: note.warehouse_id, reason: WriteOffReason.INVENTORY_SHORTAGE, items: shortageItems });
        setInventoryNotes(prev => prev.map(n => n.id === noteId ? { ...n, status: DocumentStatus.CONFIRMED } : n));
    };

    const calculateProducibleQuantity = (dishId: string, warehouseId: string): number => {
        const recipe = recipes.find(r => r.dishId === dishId);
        if (!recipe || recipe.outputYield <= 0) {
            return 0;
        }
        if (recipe.items.length === 0) {
            return Number.MAX_SAFE_INTEGER;
        }
    
        let minBatches: number | null = null;
    
        for (const item of recipe.items) {
            const productStock = stock
                .filter(s => s.productId === item.productId && s.warehouseId === warehouseId)
                .reduce((sum, s) => sum + s.quantity, 0);
            
            if (item.grossQuantity <= 0) {
                continue;
            }
    
            const producibleBatches = productStock / item.grossQuantity;
            if (minBatches === null || producibleBatches < minBatches) {
                minBatches = producibleBatches;
            }
        }
        
        if (minBatches === null) {
            return Number.MAX_SAFE_INTEGER;
        }
    
        return Math.floor(minBatches * recipe.outputYield);
    };

    const produceDishes = (warehouseId: string, productionPlan: { dishId: string, quantity: number }[]) => {
        const ingredientsToConsume = new Map<string, number>();
        productionPlan.forEach(planItem => {
            const recipe = recipes.find(r => r.dishId === planItem.dishId);
            if (!recipe || recipe.outputYield <= 0) throw new Error(`Retsept topilmadi yoki xato: ${dishes.find(d => d.id === planItem.dishId)?.name}`);
            const batchesToProduce = planItem.quantity / recipe.outputYield;
            recipe.items.forEach(ingredient => {
                const currentQty = ingredientsToConsume.get(ingredient.productId) || 0;
                ingredientsToConsume.set(ingredient.productId, currentQty + (ingredient.grossQuantity * batchesToProduce));
            });
        });

        if (ingredientsToConsume.size === 0) return;

        let tempStock = JSON.parse(JSON.stringify(stock));
        const consumedItems: WriteOffItem[] = [];
        for (const [productId, quantity] of ingredientsToConsume.entries()) {
            const { updatedStock, consumedCost, consumedBatches } = consumeStockByFIFO({ productId }, warehouseId, quantity, tempStock);
            tempStock = updatedStock;
            consumedItems.push({ productId, quantity, cost: consumedCost, consumedBatches });
        }
        
        const producedItems: ProductionProducedItem[] = [];
        productionPlan.forEach(planItem => {
            const recipe = recipes.find(r => r.dishId === planItem.dishId);
            if (!recipe) return;
            const batchesToProduce = planItem.quantity / recipe.outputYield;
            
            const totalCostForDishBatch = recipe.items.reduce((sum, ingredient) => {
                const consumedIngredient = consumedItems.find(i => i.productId === ingredient.productId);
                if (!consumedIngredient) return sum;
                const costForThisIngredient = consumedIngredient.cost * ingredient.grossQuantity * batchesToProduce;
                return sum + costForThisIngredient;
            }, 0);
            
            const costPerDish = planItem.quantity > 0 ? totalCostForDishBatch / planItem.quantity : 0;
            producedItems.push({
                dishId: planItem.dishId,
                quantity: planItem.quantity,
                cost: costPerDish,
            });
        });

        const doc_number = `PROD-${(productionNotes.length + 1).toString().padStart(4, '0')}`;
        const newNote: ProductionNote = {
            id: `prod${Date.now()}`,
            doc_number,
            warehouse_id: warehouseId,
            date: new Date().toISOString(),
            status: DocumentStatus.CONFIRMED,
            consumedItems,
            producedItems,
        };

        const newDishStockItems: Stock[] = producedItems.map(item => ({
            batchId: `prod-${newNote.id}-${item.dishId}`,
            dishId: item.dishId,
            warehouseId: warehouseId,
            quantity: item.quantity,
            cost: item.cost,
            receiptDate: newNote.date,
        }));
        
        setStock([...tempStock, ...newDishStockItems]);
        setProductionNotes(prev => [newNote, ...prev]);
    };


    return {
        writeOffs, setWriteOffs, addWriteOff, updateWriteOff, deleteWriteOff, confirmWriteOff, addAndConfirmWriteOff,
        internalTransfers, setInternalTransfers, addInternalTransfer, updateInternalTransfer, confirmInternalTransfer,
        inventoryNotes, setInventoryNotes, addInventoryNote, updateInventoryNote, confirmInventoryNote,
        productionNotes, setProductionNotes,
        produceDishes,
        calculateProducibleQuantity
    };
};