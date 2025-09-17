
import { useState } from 'react';
import { 
    Product, Warehouse, Supplier, Unit, Stock,
    GoodsReceiptNote, GoodsReceiptItem, DocumentStatus,
    WriteOffNote, WriteOffReason, WriteOffItem,
    InternalTransferNote, InternalTransferItem,
    InventoryNote, InventoryItem,
    Payment, PaymentMethod, PaymentLink,
    GoodsReturnNote, GoodsReturnItem,
    Dish, Recipe
} from '../types';

const initialProducts: Product[] = [
    { id: 'p1', name: 'Lavash xamiri', sku: 'SKU-001', category: 'Xamir mahsulotlari', unit: Unit.DONA, min_stock: 10 },
    { id: 'p2', name: 'Burger bulochkasi', sku: 'SKU-002', category: 'Non mahsulotlari', unit: Unit.DONA, min_stock: 10 },
    { id: 'p3', name: 'Mol go‘shti kotleti', sku: 'SKU-003', category: 'Go‘sht', unit: Unit.DONA, min_stock: 10 },
    { id: 'p4', name: 'Tovuq filesi', sku: 'SKU-004', category: 'Go‘sht', unit: Unit.DONA, min_stock: 10 },
    { id: 'p5', name: 'Tovuq shawarma go‘shti', sku: 'SKU-005', category: 'Go‘sht', unit: Unit.DONA, min_stock: 10 },
    { id: 'p6', name: 'Sosiska (hot-dog uchun)', sku: 'SKU-006', category: 'Go‘sht', unit: Unit.DONA, min_stock: 10 },
    { id: 'p7', name: 'Pomidor', sku: 'SKU-007', category: 'Sabzavotlar', unit: Unit.DONA, min_stock: 10 },
    { id: 'p8', name: 'Bodring (tuzlangan)', sku: 'SKU-008', category: 'Sabzavotlar', unit: Unit.DONA, min_stock: 10 },
    { id: 'p9', name: 'Piyoz (halqa)', sku: 'SKU-009', category: 'Sabzavotlar', unit: Unit.DONA, min_stock: 10 },
    { id: 'p10', name: 'Salat bargi (Iceberg)', sku: 'SKU-010', category: 'Sabzavotlar', unit: Unit.DONA, min_stock: 10 },
    { id: 'p11', name: 'Jalapeno (achchiq qalampir)', sku: 'SKU-011', category: 'Sabzavotlar', unit: Unit.DONA, min_stock: 10 },
    { id: 'p12', name: 'Qo‘ziqorin (konserva)', sku: 'SKU-012', category: 'Sabzavotlar', unit: Unit.DONA, min_stock: 10 },
    { id: 'p13', name: 'Pishloq (Cheddar)', sku: 'SKU-013', category: 'Sut mahsulotlari', unit: Unit.DONA, min_stock: 10 },
    { id: 'p14', name: 'Mozzarella pishlog‘i', sku: 'SKU-014', category: 'Sut mahsulotlari', unit: Unit.DONA, min_stock: 10 },
    { id: 'p15', name: 'Kartoshka fri', sku: 'SKU-015', category: 'Muzlatilgan', unit: Unit.DONA, min_stock: 10 },
    { id: 'p16', name: 'Ketchup', sku: 'SKU-016', category: 'Souslar', unit: Unit.DONA, min_stock: 10 },
    { id: 'p17', name: 'Mayonez', sku: 'SKU-017', category: 'Souslar', unit: Unit.DONA, min_stock: 10 },
    { id: 'p18', name: 'Barbekyu sous', sku: 'SKU-018', category: 'Souslar', unit: Unit.DONA, min_stock: 10 },
    { id: 'p19', name: 'Chili sous', sku: 'SKU-019', category: 'Souslar', unit: Unit.DONA, min_stock: 10 },
    { id: 'p20', name: 'Sarimsoq sous', sku: 'SKU-020', category: 'Souslar', unit: Unit.DONA, min_stock: 10 },
    { id: 'p21', name: 'Ranch sous', sku: 'SKU-021', category: 'Souslar', unit: Unit.DONA, min_stock: 10 },
    { id: 'p22', name: 'Yengil tortilla', sku: 'SKU-022', category: 'Xamir mahsulotlari', unit: Unit.DONA, min_stock: 10 },
    { id: 'p23', name: 'Choy paketlari', sku: 'SKU-023', category: 'Ichimliklar', unit: Unit.DONA, min_stock: 10 },
    { id: 'p24', name: 'Qahva kapsulasi/donasi', sku: 'SKU-024', category: 'Ichimliklar', unit: Unit.DONA, min_stock: 10 },
];

const initialWarehouses: Warehouse[] = [];

const initialSuppliers: Supplier[] = [];

const initialStock: Stock[] = [];

const initialGoodsReceipts: GoodsReceiptNote[] = [];

const initialDishes: Dish[] = [];

const initialRecipes: Recipe[] = [];


const formatCurrency = (amount: number) => new Intl.NumberFormat('uz-UZ').format(amount);

export const useMockData = () => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [warehouses, setWarehouses] = useState<Warehouse[]>(initialWarehouses);
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [stock, setStock] = useState<Stock[]>(initialStock);
  const [goodsReceipts, setGoodsReceipts] = useState<GoodsReceiptNote[]>(initialGoodsReceipts);
  const [writeOffs, setWriteOffs] = useState<WriteOffNote[]>([]);
  const [internalTransfers, setInternalTransfers] = useState<InternalTransferNote[]>([]);
  const [inventoryNotes, setInventoryNotes] = useState<InventoryNote[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [goodsReturns, setGoodsReturns] = useState<GoodsReturnNote[]>([]);
  const [dishes, setDishes] = useState<Dish[]>(initialDishes);
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes);


  // Helpers
  const getTotalStockQuantity = (productId: string, warehouseId: string, currentStock: Stock[] = stock) => {
    return currentStock
        .filter(s => s.productId === productId && s.warehouseId === warehouseId)
        .reduce((sum, s) => sum + s.quantity, 0);
  }
  const getTotalStockAcrossWarehouses = (productId: string) => {
      return stock.filter(s => s.productId === productId && s.quantity > 0)
                  .reduce((sum, s) => sum + s.quantity, 0);
  }
  const getProduct = (productId: string) => products.find(p => p.id === productId);
  const getNoteTotal = (items: GoodsReceiptItem[]) => items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const calculateProducibleQuantity = (dishId: string, warehouseId: string): number => {
    const recipe = recipes.find(r => r.dishId === dishId);
    if (!recipe) return 0;

    let maxPortions = Infinity;

    for (const ingredient of recipe.items) {
        const ingredientStock = getTotalStockQuantity(ingredient.productId, warehouseId);
        if (ingredient.quantity <= 0) continue; // Avoid division by zero
        const portionsFromIngredient = ingredientStock / ingredient.quantity;
        if (portionsFromIngredient < maxPortions) {
            maxPortions = portionsFromIngredient;
        }
    }

    return maxPortions === Infinity ? 0 : Math.floor(maxPortions);
  };


  const getSupplierBalance = (supplierId: string) => {
      const supplier = suppliers.find(s => s.id === supplierId);
      if (!supplier) return 0;

      const totalReceipts = goodsReceipts.reduce((sum, note) => {
          if (note.supplier_id === supplierId && note.status === DocumentStatus.CONFIRMED) {
              return sum + getNoteTotal(note.items);
          }
          return sum;
      }, 0);

      const totalPayments = payments.reduce((sum, payment) => {
          if (payment.supplier_id === supplierId) {
              return sum + payment.amount;
          }
          return sum;
      }, 0);

      const totalReturns = goodsReturns.reduce((sum, note) => {
        if(note.supplier_id === supplierId && note.status === DocumentStatus.CONFIRMED) {
            const returnTotal = note.items.reduce((itemSum, item) => itemSum + item.quantity * item.cost, 0);
            return sum + returnTotal;
        }
        return sum;
      }, 0);


      return supplier.initial_balance + totalReceipts - totalPayments - totalReturns;
  }

  const getStockAsOf = (targetDateStr: string): Stock[] => {
        const targetDate = new Date(targetDateStr);
        targetDate.setHours(23, 59, 59, 999);

        const allDocs = [
            ...goodsReceipts.map(d => ({ ...d, docType: 'receipt', date: new Date(d.date) } as const)),
            ...writeOffs.map(d => ({ ...d, docType: 'writeoff', date: new Date(d.date) } as const)),
            ...internalTransfers.map(d => ({ ...d, docType: 'transfer', date: new Date(d.date) } as const)),
            ...goodsReturns.map(d => ({ ...d, docType: 'return', date: new Date(d.date) } as const)),
        ]
        .filter(d => d.status === DocumentStatus.CONFIRMED && new Date(d.date) <= targetDate)
        .sort((a, b) => a.date.getTime() - b.date.getTime());
        
        let historicalStock: Stock[] = [];

        for (const doc of allDocs) {
            switch (doc.docType) {
                case 'receipt':
                    doc.items.forEach((item, index) => {
                        historicalStock.push({
                            batchId: `${doc.id}-i${index}`,
                            productId: item.productId,
                            warehouseId: doc.warehouse_id,
                            quantity: item.quantity,
                            cost: item.price,
                            receiptDate: doc.date.toISOString(),
                            validDate: item.validDate,
                        });
                    });
                    break;
                
                case 'writeoff':
                case 'return':
                    doc.items.forEach(item => {
                        let qtyToConsume = item.quantity;
                        const productBatches = historicalStock
                            .filter(s => s.productId === item.productId && s.warehouseId === doc.warehouse_id)
                            .sort((a,b) => new Date(a.receiptDate).getTime() - new Date(b.receiptDate).getTime());
                        
                        for (const batch of productBatches) {
                            if (qtyToConsume <= 0) break;
                            const consumeAmount = Math.min(qtyToConsume, batch.quantity);
                            batch.quantity -= consumeAmount;
                            qtyToConsume -= consumeAmount;
                        }
                    });
                    historicalStock = historicalStock.filter(s => s.quantity > 0.001);
                    break;

                case 'transfer':
                    doc.items.forEach(item => {
                        let qtyToTransfer = item.quantity;
                        const productBatches = historicalStock
                            .filter(s => s.productId === item.productId && s.warehouseId === doc.from_warehouse_id)
                            .sort((a,b) => new Date(a.receiptDate).getTime() - new Date(b.receiptDate).getTime());
                        
                        for (const batch of productBatches) {
                            if (qtyToTransfer <= 0) break;
                            const transferAmount = Math.min(qtyToTransfer, batch.quantity);
                            batch.quantity -= transferAmount;
                            qtyToTransfer -= transferAmount;

                            // Create new batch in destination warehouse
                            historicalStock.push({
                                batchId: `${batch.batchId}-t-${doc.id}`,
                                productId: item.productId,
                                warehouseId: doc.to_warehouse_id,
                                quantity: transferAmount,
                                cost: batch.cost,
                                receiptDate: doc.date.toISOString(),
                                validDate: batch.validDate,
                            });
                        }
                    });
                    historicalStock = historicalStock.filter(s => s.quantity > 0.001);
                    break;
            }
        }
        return historicalStock;
    };


  // Product Operations
  const addProduct = (product: Omit<Product, 'id'>): Product => {
    const newProduct = { ...product, id: `p${Date.now()}` };
    setProducts(prev => [newProduct, ...prev]);
    return newProduct;
  };
  const updateProduct = (updatedProduct: Product) => setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  const deleteProduct = (productId: string) => setProducts(prev => prev.filter(p => p.id !== productId));

  // Warehouse Operations
  const addWarehouse = (warehouse: Omit<Warehouse, 'id'>) => setWarehouses(prev => [{ ...warehouse, id: `w${Date.now()}` }, ...prev]);
  const updateWarehouse = (updatedWarehouse: Warehouse) => setWarehouses(prev => prev.map(w => w.id === updatedWarehouse.id ? updatedWarehouse : w));
  const deleteWarehouse = (warehouseId: string) => setWarehouses(prev => prev.filter(w => w.id !== warehouseId));
  
  // Supplier Operations
  const addSupplier = (supplier: Omit<Supplier, 'id'>): Supplier => {
    const newSupplier = { ...supplier, id: `s${Date.now()}` };
    setSuppliers(prev => [newSupplier, ...prev]);
    return newSupplier;
  };
  const updateSupplier = (updatedSupplier: Supplier) => setSuppliers(prev => prev.map(s => s.id === updatedSupplier.id ? updatedSupplier : s));
  const deleteSupplier = (supplierId: string) => setSuppliers(prev => prev.filter(s => s.id !== supplierId));
  const isInnUnique = (inn: string, currentId: string | null = null) => !suppliers.some(s => s.inn === inn && s.id !== currentId);
  
  const canDeleteSupplier = (supplierId: string): boolean => {
    const supplier = suppliers.find(s => s.id === supplierId);
    if (!supplier) {
        return true; 
    }

    const hasInitialBalance = Math.abs(supplier.initial_balance) > 0.01;
    const hasReceipts = goodsReceipts.some(gr => gr.supplier_id === supplierId);
    const hasPayments = payments.some(p => p.supplier_id === supplierId);
    const hasReturns = goodsReturns.some(gr => gr.supplier_id === supplierId);
    
    return !(hasInitialBalance || hasReceipts || hasPayments || hasReturns);
  };


  // FIFO consumption helper
  const consumeStockByFIFO = (productId: string, warehouseId: string, quantityToConsume: number, currentStock: Stock[]): { updatedStock: Stock[], consumedCost: number, consumedBatches: { batchId: string, receiptDate: string, cost: number, quantityConsumed: number }[] } => {
    let stillToConsume = quantityToConsume;
    let totalCost = 0;
    const consumedBatches: { batchId: string, receiptDate: string, cost: number, quantityConsumed: number }[] = [];

    const productBatches = currentStock
        .filter(s => s.productId === productId && s.warehouseId === warehouseId)
        .sort((a,b) => new Date(a.receiptDate).getTime() - new Date(b.receiptDate).getTime());

    if(productBatches.reduce((sum, b) => sum + b.quantity, 0) < quantityToConsume) {
        throw new Error("Omborda yetarli mahsulot mavjud emas.");
    }
    
    for(const batch of productBatches) {
        if(stillToConsume <= 0) break;
        
        const amountFromThisBatch = Math.min(stillToConsume, batch.quantity);
        totalCost += amountFromThisBatch * batch.cost;
        batch.quantity -= amountFromThisBatch;
        stillToConsume -= amountFromThisBatch;

        consumedBatches.push({
            batchId: batch.batchId,
            receiptDate: batch.receiptDate,
            cost: batch.cost,
            quantityConsumed: amountFromThisBatch
        });
    }

    const updatedStock = currentStock.filter(s => s.quantity > 0.001);
    const consumedCost = quantityToConsume > 0 ? totalCost / quantityToConsume : 0;
    
    return { updatedStock, consumedCost, consumedBatches };
  }


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
        const newGoodsReceipts = [...prev];
        newGoodsReceipts[noteIndex] = updatedNote;
        return newGoodsReceipts;
    });
  };

  const deleteGoodsReceipt = (noteId: string) => {
      setGoodsReceipts(prev => {
          const note = prev.find(n => n.id === noteId);
          if (note && note.status === DocumentStatus.CONFIRMED) {
              alert("Tasdiqlangan hujjatni o'chirib bo'lmaydi.");
              return prev;
          }
          return prev.filter(n => n.id !== noteId);
      });
  };

  const confirmGoodsReceipt = (noteId: string) => {
    const note = goodsReceipts.find(n => n.id === noteId);
    if (!note || note.status === DocumentStatus.CONFIRMED) {
        console.error("Hujjat topilmadi yoki allaqachon tasdiqlangan.");
        return;
    };

    // Create payment if there's a prepayment
    if (note.paid_amount > 0) {
        const newPayment: Payment = {
          id: `pay${Date.now()}`,
          doc_number: `P-${(payments.length + 1).toString().padStart(4, '0')}`,
          date: note.date,
          supplier_id: note.supplier_id,
          amount: note.paid_amount,
          payment_method: note.payment_method || PaymentMethod.CASH,
          links: [{ grnId: note.id, amountApplied: note.paid_amount }],
          comment: `"${note.doc_number}" hujjat uchun dastlabki to'lov`,
        };
        setPayments(prev => [newPayment, ...prev]);
    }
    
    setStock(prevStock => {
        const newBatches = note.items.map((item, index) => ({
            batchId: `${note.id}-i${index}`,
            productId: item.productId,
            warehouseId: note.warehouse_id,
            quantity: item.quantity,
            cost: item.price,
            receiptDate: note.date,
            validDate: item.validDate
        }));
        return [...prevStock, ...newBatches];
    });
    
    setGoodsReceipts(prevReceipts => 
        prevReceipts.map(n => n.id === noteId ? { ...n, status: DocumentStatus.CONFIRMED } : n)
    );
  };

  const addAndConfirmGoodsReceipt = (note: Omit<GoodsReceiptNote, 'id' | 'status' | 'doc_number'>) => {
    const newNote = addGoodsReceipt(note);
    confirmGoodsReceipt(newNote.id);
    return newNote;
  };
  
  // Write-Off Operations
  const addWriteOff = (note: Omit<WriteOffNote, 'id' | 'status' | 'doc_number'>) => {
    const doc_number = `CH-${(writeOffs.length + 1).toString().padStart(4, '0')}`;
    const newNote = { ...note, id: `wo${Date.now()}`, status: DocumentStatus.DRAFT, doc_number };
    setWriteOffs(prev => [newNote, ...prev]);
    return newNote;
  }
  const updateWriteOff = (updatedNote: WriteOffNote) => {
    setWriteOffs(prev => {
        const noteIndex = prev.findIndex(n => n.id === updatedNote.id);
        if (noteIndex === -1 || prev[noteIndex].status === DocumentStatus.CONFIRMED) {
            alert("Tasdiqlangan yoki mavjud bo'lmagan hujjatni o'zgartirib bo'lmaydi.");
            return prev;
        }
        const newWriteOffs = [...prev];
        newWriteOffs[noteIndex] = updatedNote;
        return newWriteOffs;
    });
  };

  const deleteWriteOff = (noteId: string) => {
    setWriteOffs(prev => {
        const note = prev.find(n => n.id === noteId);
        if (note && note.status === DocumentStatus.CONFIRMED) {
            alert("Tasdiqlangan hujjatni o'chirib bo'lmaydi.");
            return prev;
        }
        return prev.filter(n => n.id !== noteId);
    });
  };

  const confirmWriteOff = (noteId: string) => {
    const note = writeOffs.find(n => n.id === noteId);
    if (!note || note.status === DocumentStatus.CONFIRMED) return;

    let tempStock = JSON.parse(JSON.stringify(stock));
    const updatedItems: WriteOffItem[] = [];

    note.items.forEach(item => {
      const { updatedStock, consumedCost, consumedBatches } = consumeStockByFIFO(item.productId, note.warehouse_id, item.quantity, tempStock);
      tempStock = updatedStock;
      updatedItems.push({ ...item, cost: consumedCost, consumedBatches });
    });

    setStock(tempStock);
    setWriteOffs(prev => prev.map(n => n.id === noteId ? { ...n, items: updatedItems, status: DocumentStatus.CONFIRMED } : n));
  }


  // Internal Transfer Operations
  const addInternalTransfer = (note: Omit<InternalTransferNote, 'id' | 'status'| 'doc_number'>) => {
      const doc_number = `M-${(internalTransfers.length + 1).toString().padStart(4, '0')}`;
      const newNote = { ...note, id: `it${Date.now()}`, status: DocumentStatus.DRAFT, doc_number };
      setInternalTransfers(prev => [newNote, ...prev]);
      return newNote;
  }

  const updateInternalTransfer = (updatedNote: InternalTransferNote) => {
    setInternalTransfers(prev => {
        const noteIndex = prev.findIndex(n => n.id === updatedNote.id);
        if (noteIndex === -1 || prev[noteIndex].status === DocumentStatus.CONFIRMED) {
            alert("Tasdiqlangan yoki mavjud bo'lmagan hujjatni o'zgartirib bo'lmaydi.");
            return prev;
        }
        const newInternalTransfers = [...prev];
        newInternalTransfers[noteIndex] = updatedNote;
        return newInternalTransfers;
    });
  };
  
  const confirmInternalTransfer = (noteId: string) => {
    const note = internalTransfers.find(n => n.id === noteId);
    if (!note || note.status === DocumentStatus.CONFIRMED) return;

    let tempStock = JSON.parse(JSON.stringify(stock));
    
    note.items.forEach(item => {
        let qtyToTransfer = item.quantity;
        const productBatches = tempStock
            .filter((s: Stock) => s.productId === item.productId && s.warehouseId === note.from_warehouse_id)
            .sort((a: Stock, b: Stock) => new Date(a.receiptDate).getTime() - new Date(b.receiptDate).getTime());
        
        if (productBatches.reduce((sum: number, b: Stock) => sum + b.quantity, 0) < qtyToTransfer) {
            const productName = getProduct(item.productId)?.name || item.productId;
            throw new Error(`"${productName}" mahsuloti jo'natuvchi omborda yetarli emas.`);
        }
        
        for (const batch of productBatches) {
            if (qtyToTransfer <= 0) break;
            const transferAmount = Math.min(qtyToTransfer, batch.quantity);
            
            batch.quantity -= transferAmount;
            qtyToTransfer -= transferAmount;

            // Create a new batch in the destination warehouse
            const newBatch: Stock = {
                batchId: `${batch.batchId}-t-${note.id}`,
                productId: item.productId,
                warehouseId: note.to_warehouse_id,
                quantity: transferAmount,
                cost: batch.cost,
                receiptDate: note.date, // The transfer date becomes the new receipt date for FIFO in the new warehouse
                validDate: batch.validDate,
            };
            tempStock.push(newBatch);
        }
    });

    setStock(tempStock.filter((s: Stock) => s.quantity > 0.001));
    setInternalTransfers(prev => prev.map(n => n.id === noteId ? { ...n, status: DocumentStatus.CONFIRMED } : n));
  }


  // Inventory Operations
  const addInventoryNote = (note: Omit<InventoryNote, 'id' | 'status' | 'doc_number'>) => {
    const doc_number = `I-${(inventoryNotes.length + 1).toString().padStart(4, '0')}`;
    const newNote = { ...note, id: `inv${Date.now()}`, status: DocumentStatus.DRAFT, doc_number };
    setInventoryNotes(prev => [newNote, ...prev]);
  }

  const updateInventoryNote = (updatedNote: InventoryNote) => {
    setInventoryNotes(prev => {
        const noteIndex = prev.findIndex(n => n.id === updatedNote.id);
        if (noteIndex === -1 || prev[noteIndex].status === DocumentStatus.CONFIRMED) {
            alert("Tasdiqlangan yoki mavjud bo'lmagan hujjatni o'zgartirib bo'lmaydi.");
            return prev;
        }
        const newInventoryNotes = [...prev];
        newInventoryNotes[noteIndex] = updatedNote;
        return newInventoryNotes;
    });
  };

  const confirmInventoryNote = (noteId: string) => {
    const note = inventoryNotes.find(n => n.id === noteId);
    if (!note || note.status === DocumentStatus.CONFIRMED) return;
    
    const surplusItems: GoodsReceiptItem[] = [];
    const shortageItems: WriteOffItem[] = [];
    
    note.items.forEach(item => {
        const difference = item.difference;
        
        if(difference > 0) { // Surplus
            const productStock = stock.filter(s => s.productId === item.productId && s.warehouseId === note.warehouse_id);
            const avgCost = productStock.length > 0
                ? productStock.reduce((sum, s) => sum + s.quantity * s.cost, 0) / productStock.reduce((sum, s) => sum + s.quantity, 0)
                : 0;

            surplusItems.push({ 
                productId: item.productId, 
                quantity: difference, 
                price: avgCost,
                batchId: `inv-${note.id}-${item.productId}`,
                validDate: new Date().toISOString(), // Default valid date, might need better logic
                // No valid date for surplus, or maybe we should ask? For now, today.
            });
        } else if (difference < 0) { // Shortage
            shortageItems.push({
                productId: item.productId,
                quantity: Math.abs(difference),
                cost: 0, // Cost will be calculated by confirmWriteOff
            });
        }
    });

    if (surplusItems.length > 0) {
        addAndConfirmGoodsReceipt({
            date: note.date,
            supplier_id: 'SYSTEM',
            warehouse_id: note.warehouse_id,
            items: surplusItems,
            type: 'inventory_surplus',
            paid_amount: 0,
        });
    }

    if (shortageItems.length > 0) {
        const shortageNote = addWriteOff({
            date: note.date,
            warehouse_id: note.warehouse_id,
            reason: WriteOffReason.INVENTORY_SHORTAGE,
            items: shortageItems,
        });
        confirmWriteOff(shortageNote.id);
    }
    
    setInventoryNotes(prev => prev.map(n => n.id === noteId ? { ...n, status: DocumentStatus.CONFIRMED } : n));
  }

  // Goods Return Operations
  const addGoodsReturn = (note: Omit<GoodsReturnNote, 'id' | 'status' | 'doc_number'>) => {
    const doc_number = `Q-${(goodsReturns.length + 1).toString().padStart(4, '0')}`;
    const newNote = { ...note, id: `grtn${Date.now()}`, status: DocumentStatus.DRAFT, doc_number };
    setGoodsReturns(prev => [newNote, ...prev]);
    return newNote;
  }
  const updateGoodsReturn = (updatedNote: GoodsReturnNote) => {
    setGoodsReturns(prev => {
        const noteIndex = prev.findIndex(n => n.id === updatedNote.id);
        if (noteIndex === -1 || prev[noteIndex].status === DocumentStatus.CONFIRMED) {
            alert("Tasdiqlangan yoki mavjud bo'lmagan hujjatni o'zgartirib bo'lmaydi.");
            return prev;
        }
        const newGoodsReturns = [...prev];
        newGoodsReturns[noteIndex] = updatedNote;
        return newGoodsReturns;
    });
  };

  const confirmGoodsReturn = (noteId: string) => {
    const note = goodsReturns.find(n => n.id === noteId);
    if (!note || note.status === DocumentStatus.CONFIRMED) return;

    let tempStock = JSON.parse(JSON.stringify(stock));
    const updatedItems: GoodsReturnItem[] = [];

    note.items.forEach(item => {
        const { updatedStock, consumedCost, consumedBatches } = consumeStockByFIFO(item.productId, note.warehouse_id, item.quantity, tempStock);
        tempStock = updatedStock;
        updatedItems.push({ ...item, cost: consumedCost, consumedBatches });
    });
    
    setStock(tempStock);
    setGoodsReturns(prev => prev.map(n => n.id === noteId ? { ...n, items: updatedItems, status: DocumentStatus.CONFIRMED } : n));
  }
  
  // Payment Operations
  const addPayment = (paymentData: Omit<Payment, 'id' | 'doc_number' | 'links'>) => {
      const paymentLinks: PaymentLink[] = [];
      const updatesToApply = new Map<string, number>();
      let amountToApply = paymentData.amount;

      const unpaidGrns = goodsReceipts
          .filter(g => g.supplier_id === paymentData.supplier_id && g.status === DocumentStatus.CONFIRMED && (getNoteTotal(g.items) - g.paid_amount) > 0.01)
          .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      for (const grn of unpaidGrns) {
          if (amountToApply <= 0) break;

          const dueAmount = getNoteTotal(grn.items) - grn.paid_amount;
          const amountToCredit = Math.min(amountToApply, dueAmount);

          updatesToApply.set(grn.id, amountToCredit);
          paymentLinks.push({ grnId: grn.id, amountApplied: amountToCredit });
          amountToApply -= amountToCredit;
      }
      
      const newPayment: Payment = {
          ...paymentData,
          id: `pay${Date.now()}`,
          doc_number: `P-${(payments.length + 1).toString().padStart(4, '0')}`,
          links: paymentLinks
      };

      setPayments(prev => [newPayment, ...prev]);

      setGoodsReceipts(prevReceipts => 
          prevReceipts.map(r => {
              if (updatesToApply.has(r.id)) {
                  return { ...r, paid_amount: r.paid_amount + updatesToApply.get(r.id)! };
              }
              return r;
          })
      );
  }

    const addDirectPaymentForNote = (noteId: string, amount: number, paymentMethod: PaymentMethod, comment: string) => {
        const note = goodsReceipts.find(n => n.id === noteId);
        if (!note || note.status !== DocumentStatus.CONFIRMED) {
          throw new Error("Faqat tasdiqlangan hujjatlar uchun to'lov qilish mumkin.");
        }
        
        const total = getNoteTotal(note.items);
        const dueAmount = total - note.paid_amount;
        
        if (amount <= 0) {
            throw new Error("To'lov summasi noldan katta bo'lishi kerak.");
        }
    
        if (amount > dueAmount + 0.01) { // Add a small epsilon for float comparison
            throw new Error(`To'lov summasi qarz miqdoridan (${formatCurrency(dueAmount)} so'm) oshib ketmasligi kerak.`);
        }
        
        const newPayment: Payment = {
          id: `pay${Date.now()}`,
          doc_number: `P-${(payments.length + 1).toString().padStart(4, '0')}`,
          date: new Date().toISOString(),
          supplier_id: note.supplier_id,
          amount: amount,
          payment_method: paymentMethod,
          links: [{ grnId: noteId, amountApplied: amount }],
          comment: comment || `"${note.doc_number}" hujjat uchun to'lov`,
        };
    
        setPayments(prev => [newPayment, ...prev]);
    
        setGoodsReceipts(prevReceipts => 
          prevReceipts.map(r => {
            if (r.id === noteId) {
              return { ...r, paid_amount: r.paid_amount + amount };
            }
            return r;
          })
        );
      };

  return {
    products, addProduct, updateProduct, deleteProduct,
    warehouses, addWarehouse, updateWarehouse, deleteWarehouse,
    suppliers, addSupplier, updateSupplier, deleteSupplier, isInnUnique, canDeleteSupplier,
    stock, getTotalStockQuantity, getTotalStockAcrossWarehouses, getStockAsOf,
    goodsReceipts, addGoodsReceipt, updateGoodsReceipt, deleteGoodsReceipt, confirmGoodsReceipt, addAndConfirmGoodsReceipt, getNoteTotal,
    writeOffs, addWriteOff, updateWriteOff, deleteWriteOff, confirmWriteOff,
    internalTransfers, addInternalTransfer, updateInternalTransfer, confirmInternalTransfer,
    inventoryNotes, addInventoryNote, updateInventoryNote, confirmInventoryNote,
    goodsReturns, addGoodsReturn, updateGoodsReturn, confirmGoodsReturn,
    payments, addPayment, addDirectPaymentForNote,
    dishes,
    recipes,
    calculateProducibleQuantity,
    getSupplierBalance,
  };
};

export type UseMockDataReturnType = ReturnType<typeof useMockData>;
