
import { useState } from 'react';
import { 
    Product, Warehouse, Supplier, Unit, Stock,
    GoodsReceiptNote, GoodsReceiptItem, DocumentStatus,
    WriteOffNote, WriteOffReason, WriteOffItem,
    InternalTransferNote, InternalTransferItem,
    InventoryNote, InventoryItem,
    Payment, PaymentMethod, PaymentLink
} from '../types';

const initialProducts: Product[] = [
  { id: 'p1', name: 'Un (Oliy nav)', sku: 'FLR-001', category: 'Bakaleya', unit: Unit.KG, min_stock: 50 },
  { id: 'p2', name: 'Shakar', sku: 'SGR-001', category: 'Bakaleya', unit: Unit.KG, min_stock: 100 },
  { id: 'p3', name: 'Tuz', sku: 'SLT-001', category: 'Bakaleya', unit: Unit.KG, min_stock: 20 },
  { id: 'p4', name: 'Kungaboqar yog\'i', sku: 'OIL-001', category: 'Yog\'lar', unit: Unit.L, min_stock: 30 },
  { id: 'p5', name: 'Tuxum', sku: 'EGG-001', category: 'Sut mahsulotlari', unit: Unit.DONA, min_stock: 200 },
];

const initialWarehouses: Warehouse[] = [
  { id: 'w1', name: 'Asosiy Ombor', location: 'Toshkent, Shayxontohur tumani', is_active: true },
  { id: 'w2', name: 'Filial Ombori', location: 'Toshkent, Yunusobod tumani', is_active: true },
  { id: 'w3', name: 'Yordamchi Ombor', location: 'Toshkent viloyati, Zangiota', is_active: false },
];

const initialSuppliers: Supplier[] = [
  { id: 's1', name: '"Agro-Eksport" MChJ', inn: '301234567', phone: '+998901234567', address: 'Farg\'ona viloyati', initial_balance: 500000, credit_limit: 3000000 },
  { id: 's2', name: '"Universal Trade" XK', inn: '302345678', phone: '+998912345678', address: 'Toshkent shahri', initial_balance: -200000, credit_limit: 0 },
];

const initialStock: Stock[] = [
    { id: 'stk1', productId: 'p1', warehouseId: 'w1', quantity: 120, cost: 5000, batch_number: 'B-001', expiry_date: new Date(2025, 5, 1).toISOString(), received_date: new Date(2024, 5, 1).toISOString() },
    { id: 'stk2', productId: 'p2', warehouseId: 'w1', quantity: 80, cost: 11000, batch_number: 'B-002', expiry_date: new Date(2025, 10, 1).toISOString(), received_date: new Date(2024, 5, 10).toISOString() },
    { id: 'stk3', productId: 'p4', warehouseId: 'w1', quantity: 15, cost: 18000, batch_number: 'B-003', received_date: new Date(2024, 4, 20).toISOString() },
    { id: 'stk4', productId: 'p1', warehouseId: 'w2', quantity: 30, cost: 5200, batch_number: 'B-004', expiry_date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(), received_date: new Date(2024, 5, 5).toISOString() },
];

const initialGoodsReceipts: GoodsReceiptNote[] = [
    { id: 'grn1', doc_number: 'K-0001', supplier_id: 's1', warehouse_id: 'w1', date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), status: DocumentStatus.CONFIRMED, items: [{productId: 'p1', quantity: 100, price: 5000, batch_number: '1-1', expiry_date: new Date(2025, 5, 1).toISOString()}], paid_amount: 500000 },
    { id: 'grn2', doc_number: 'K-0002', supplier_id: 's2', warehouse_id: 'w1', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), status: DocumentStatus.CONFIRMED, items: [{productId: 'p2', quantity: 200, price: 11500, batch_number: '1-1', expiry_date: new Date(2025, 11, 1).toISOString()}], paid_amount: 1000000 },
    { id: 'grn3', doc_number: 'K-0003', supplier_id: 's1', warehouse_id: 'w2', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), status: DocumentStatus.DRAFT, items: [{productId: 'p5', quantity: 1000, price: 1400, batch_number: '1-1', expiry_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString()}], paid_amount: 0 },
]

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

  // Helpers
  const getProductBatches = (productId: string, warehouseId: string, currentStock: Stock[] = stock) => {
    return currentStock
        .filter(s => s.productId === productId && s.warehouseId === warehouseId && s.quantity > 0)
        .sort((a,b) => {
            if(a.expiry_date && b.expiry_date) return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
            if(a.expiry_date) return -1;
            if(b.expiry_date) return 1;
            return new Date(a.received_date).getTime() - new Date(b.received_date).getTime();
        });
  }
  const getTotalStockQuantity = (productId: string, warehouseId: string) => {
    return getProductBatches(productId, warehouseId).reduce((sum, s) => sum + s.quantity, 0);
  }
  const getTotalStockAcrossWarehouses = (productId: string) => {
      return stock.filter(s => s.productId === productId && s.quantity > 0)
                  .reduce((sum, s) => sum + s.quantity, 0);
  }
  const getProduct = (productId: string) => products.find(p => p.id === productId);
  const getNoteTotal = (items: GoodsReceiptItem[]) => items.reduce((sum, item) => sum + item.price * item.quantity, 0);

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

      return supplier.initial_balance + totalReceipts - totalPayments;
  }

    const checkCreditLimit = (note: GoodsReceiptNote) => {
        const supplier = suppliers.find(s => s.id === note.supplier_id);
        if (note.status === DocumentStatus.CONFIRMED || !supplier || !supplier.credit_limit || supplier.credit_limit <= 0) {
            return { exceeds: false, amount: 0 };
        }
        
        const balanceWithoutThisNote = getSupplierBalance(note.supplier_id);
        const noteTotal = getNoteTotal(note.items);
        const debtWithoutThisNote = Math.max(0, balanceWithoutThisNote);

        if (debtWithoutThisNote + noteTotal > supplier.credit_limit) {
            const exceededAmount = (debtWithoutThisNote + noteTotal - supplier.credit_limit);
            return { exceeds: true, amount: exceededAmount };
        }
        
        return { exceeds: false, amount: 0 };
    }

  const getStockAsOf = (targetDateStr: string): Stock[] => {
        const targetDate = new Date(targetDateStr);
        targetDate.setHours(23, 59, 59, 999);

        const confirmedReceipts = goodsReceipts.filter(d => d.status === DocumentStatus.CONFIRMED && new Date(d.date) <= targetDate);
        const confirmedWriteOffs = writeOffs.filter(d => d.status === DocumentStatus.CONFIRMED && new Date(d.date) <= targetDate);
        const confirmedTransfers = internalTransfers.filter(d => d.status === DocumentStatus.CONFIRMED && new Date(d.date) <= targetDate);
        
        const allDocs = [
            ...confirmedReceipts.map(d => ({ ...d, docType: 'receipt', date: new Date(d.date) } as const)),
            ...confirmedWriteOffs.map(d => ({ ...d, docType: 'writeoff', date: new Date(d.date) } as const)),
            ...confirmedTransfers.map(d => ({ ...d, docType: 'transfer', date: new Date(d.date) } as const))
        ].sort((a, b) => a.date.getTime() - b.date.getTime());
        
        const stockState: Map<string, Stock> = new Map();

        // This is a simplified approach using event sourcing.
        // It's not the most performant for very large datasets but accurate for this mock.
        
        allDocs.forEach(doc => {
            switch (doc.docType) {
                case 'receipt':
                    doc.items.forEach(item => {
                        const key = `${item.productId}-${doc.warehouse_id}-${item.batch_number}`;
                        const existing = stockState.get(key);
                        if(existing) {
                            existing.quantity += item.quantity;
                        } else {
                            const newStockItem: Stock = {
                                id: `stk_hist_${doc.id}_${item.productId}_${item.batch_number}`,
                                productId: item.productId,
                                warehouseId: doc.warehouse_id,
                                quantity: item.quantity,
                                cost: item.price,
                                batch_number: item.batch_number,
                                expiry_date: item.expiry_date,
                                received_date: doc.date.toISOString(),
                            };
                            stockState.set(key, newStockItem);
                        }
                    });
                    break;
                case 'writeoff':
                     doc.items.forEach(item => {
                        const key = `${item.productId}-${doc.warehouse_id}-${item.batch_number}`;
                        const stockItem = stockState.get(key);
                        if (stockItem) {
                            stockItem.quantity -= item.quantity;
                        }
                    });
                    break;
                case 'transfer':
                    doc.items.forEach(item => {
                         const fromKey = `${item.productId}-${doc.from_warehouse_id}-${item.batch_number}`;
                         const fromStock = stockState.get(fromKey);
                         
                         if(fromStock) {
                            fromStock.quantity -= item.quantity;
                            
                            const toKey = `${item.productId}-${doc.to_warehouse_id}-${item.batch_number}`;
                            const toStock = stockState.get(toKey);
                            if(toStock) {
                                toStock.quantity += item.quantity;
                            } else {
                                // Important: Create a new stock item instance for the new location
                                const newStockItem: Stock = {
                                    ...fromStock,
                                    id: `stk_hist_t_${doc.id}_${item.productId}`,
                                    warehouseId: doc.to_warehouse_id,
                                    quantity: item.quantity,
                                };
                                stockState.set(toKey, newStockItem);
                            }
                         }
                    });
                    break;
            }
        });
        return Array.from(stockState.values()).filter(s => s.quantity > 0.001);
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

    const creditCheck = checkCreditLimit(note);
    if (creditCheck.exceeds) {
      throw new Error(`Kredit limiti oshib ketdi! (${creditCheck.amount.toLocaleString('uz-UZ')} so'm). Hujjatni tasdiqlash mumkin emas.`);
    }
    
    // Create new stock items from the receipt
    const newStockItems: Stock[] = note.items.map(item => ({
        id: `stk${Date.now()}_${Math.random()}`,
        productId: item.productId,
        warehouseId: note.warehouse_id,
        quantity: item.quantity,
        cost: item.price,
        batch_number: item.batch_number,
        expiry_date: item.expiry_date,
        received_date: note.date,
    }));

    // Update stock state
    setStock(prevStock => [...prevStock, ...newStockItems]);
    
    // Update goods receipt status
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

  const confirmWriteOff = (noteId: string) => {
    const note = writeOffs.find(n => n.id === noteId);
    if (!note || note.status === DocumentStatus.CONFIRMED) return;

    setStock(prevStock => {
        let tempStock = JSON.parse(JSON.stringify(prevStock)); // Deep copy to avoid mutation issues
        let errors: string[] = [];
        
        note.items.forEach(item => {
            let remainingQty = item.quantity;
            const stockBatches = getProductBatches(item.productId, note.warehouse_id, tempStock);

            if (stockBatches.reduce((acc, s) => acc + s.quantity, 0) < item.quantity) {
                const productName = getProduct(item.productId)?.name || 'Noma\'lum mahsulot';
                errors.push(`"${productName}" mahsuloti omborda yetarli emas!`);
                return;
            }

            for (const batch of stockBatches) {
                if (remainingQty <= 0) break;
                const qtyToTake = Math.min(remainingQty, batch.quantity);
                const stockToUpdate = tempStock.find((s: Stock) => s.id === batch.id);
                if (stockToUpdate) {
                    stockToUpdate.quantity -= qtyToTake;
                    remainingQty -= qtyToTake;
                }
            }
        });

        if (errors.length > 0) {
            throw new Error(errors.join('\n'));
        }

        // If validation is successful, update the write-off note's status
        setWriteOffs(prev => prev.map(n => n.id === noteId ? { ...n, status: DocumentStatus.CONFIRMED } : n));
        
        // And return the new stock state
        return tempStock.filter((s: Stock) => s.quantity > 0.001);
    });
  }


  // Internal Transfer Operations
  const addInternalTransfer = (note: Omit<InternalTransferNote, 'id' | 'status'| 'doc_number'>) => {
      const doc_number = `M-${(internalTransfers.length + 1).toString().padStart(4, '0')}`;
      const newNote = { ...note, id: `it${Date.now()}`, status: DocumentStatus.DRAFT, doc_number };
      setInternalTransfers(prev => [newNote, ...prev]);
      return newNote;
  }
  
  const confirmInternalTransfer = (noteId: string) => {
    const note = internalTransfers.find(n => n.id === noteId);
    if (!note || note.status === DocumentStatus.CONFIRMED) return;

    setStock(prevStock => {
        let tempStock: Stock[] = JSON.parse(JSON.stringify(prevStock));
        let errors: string[] = [];

        note.items.forEach(item => {
            const fromStockBatches = getProductBatches(item.productId, note.from_warehouse_id, tempStock);
            
            if (fromStockBatches.reduce((acc, s) => acc + s.quantity, 0) < item.quantity) {
                const productName = getProduct(item.productId)?.name;
                errors.push(`"${productName}" jo'natuvchi omborda yetarli emas!`);
                return;
            }
            
            let remainingQtyToTransfer = item.quantity;
            for (const batch of fromStockBatches) {
                if (remainingQtyToTransfer <= 0) break;
                const qtyToTake = Math.min(remainingQtyToTransfer, batch.quantity);
                
                const stockToUpdate = tempStock.find(s => s.id === batch.id);
                if (stockToUpdate) {
                    stockToUpdate.quantity -= qtyToTake;
                }

                // Check if a similar stock item already exists at the destination
                const existingToStock = tempStock.find(s => s.productId === item.productId && s.warehouseId === note.to_warehouse_id && s.batch_number === batch.batch_number);
                if(existingToStock) {
                    existingToStock.quantity += qtyToTake;
                } else {
                    const newStockItem: Stock = {
                        id: `stk${Date.now()}_${Math.random()}`,
                        productId: item.productId,
                        warehouseId: note.to_warehouse_id,
                        quantity: qtyToTake,
                        cost: batch.cost,
                        batch_number: batch.batch_number,
                        expiry_date: batch.expiry_date,
                        received_date: batch.received_date, // Should this be transfer date? For now, keep original.
                    };
                    tempStock.push(newStockItem);
                }
                remainingQtyToTransfer -= qtyToTake;
            }
        });

        if (errors.length > 0) {
            throw new Error(errors.join('\n'));
        }

        setInternalTransfers(prev => prev.map(n => n.id === noteId ? { ...n, status: DocumentStatus.CONFIRMED } : n));
        
        return tempStock.filter(s => s.quantity > 0.001);
    });
}


  // Inventory Operations
  const addInventoryNote = (note: Omit<InventoryNote, 'id' | 'status' | 'doc_number'>) => {
    const doc_number = `I-${(inventoryNotes.length + 1).toString().padStart(4, '0')}`;
    const newNote = { ...note, id: `inv${Date.now()}`, status: DocumentStatus.DRAFT, doc_number };
    setInventoryNotes(prev => [newNote, ...prev]);
  }

  const confirmInventoryNote = (noteId: string) => {
    const note = inventoryNotes.find(n => n.id === noteId);
    if (!note || note.status === DocumentStatus.CONFIRMED) return;
    
    const surplusItems: GoodsReceiptItem[] = [];
    const shortageItems: WriteOffItem[] = [];
    
    const productIdsWithDiff = new Set(note.items.filter(i => i.difference !== 0).map(i => i.productId));

    productIdsWithDiff.forEach(productId => {
        const item = note.items.find(i => i.productId === productId)!;
        const difference = item.difference;
        
        if(difference > 0) { // Ortiqcha
            const batches = getProductBatches(productId, note.warehouse_id);
            const lastCost = batches.length > 0 ? batches[batches.length-1].cost : 0;
            surplusItems.push({ 
                productId: item.productId, 
                quantity: difference, 
                price: lastCost, 
                batch_number: `INV-${note.doc_number}`,
                expiry_date: undefined,
            });
        } else if (difference < 0) { // Kamomad
            let shortageToCover = Math.abs(difference);
            const batches = getProductBatches(productId, note.warehouse_id);

            for (const batch of batches) {
                if (shortageToCover <= 0) break;
                const quantityToWriteOff = Math.min(shortageToCover, batch.quantity);
                shortageItems.push({
                    productId: productId,
                    batch_number: batch.batch_number,
                    quantity: quantityToWriteOff,
                    cost: batch.cost
                });
                shortageToCover -= quantityToWriteOff;
            }
        }
    });


    if (surplusItems.length > 0) {
        const surplusNote = addAndConfirmGoodsReceipt({
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
  
  // Payment Operations
  const addPayment = (paymentData: Omit<Payment, 'id' | 'doc_number' | 'links'>) => {
      const paymentLinks: PaymentLink[] = [];
      const updatesToApply = new Map<string, number>();
      let amountToApply = paymentData.amount;

      // Base the calculation on the current state of goodsReceipts
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

      // Use functional update to avoid race conditions/stale state
      setGoodsReceipts(prevReceipts => 
          prevReceipts.map(r => {
              if (updatesToApply.has(r.id)) {
                  return { ...r, paid_amount: r.paid_amount + updatesToApply.get(r.id)! };
              }
              return r;
          })
      );
  }

  const generateNextBatchNumber = (productId: string) => {
    if (!productId) return '';

    // We only count confirmed documents for historical data
    const notesWithProduct = goodsReceipts.filter(note => 
        note.status === DocumentStatus.CONFIRMED && note.items.some(item => item.productId === productId)
    );
    
    const totalCount = notesWithProduct.length + 1;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const notesInCurrentMonth = notesWithProduct.filter(note => {
        const noteDate = new Date(note.date);
        return noteDate.getMonth() === currentMonth && noteDate.getFullYear() === currentYear;
    });

    const monthlyCount = notesInCurrentMonth.length + 1;

    return `${monthlyCount}-${totalCount}`;
  };


  return {
    products, addProduct, updateProduct, deleteProduct,
    warehouses, addWarehouse, updateWarehouse, deleteWarehouse,
    suppliers, addSupplier, updateSupplier, deleteSupplier, isInnUnique,
    stock, getProductBatches, getTotalStockQuantity, getTotalStockAcrossWarehouses, getStockAsOf,
    goodsReceipts, addGoodsReceipt, updateGoodsReceipt, deleteGoodsReceipt, confirmGoodsReceipt, addAndConfirmGoodsReceipt, getNoteTotal,
    writeOffs, addWriteOff, confirmWriteOff,
    internalTransfers, addInternalTransfer, confirmInternalTransfer,
    inventoryNotes, addInventoryNote, confirmInventoryNote,
    payments, addPayment,
    getSupplierBalance,
    checkCreditLimit,
    generateNextBatchNumber,
  };
};

export type UseMockDataReturnType = ReturnType<typeof useMockData>;
