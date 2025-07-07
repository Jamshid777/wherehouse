
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
    { id: 'p1-w1', productId: 'p1', warehouseId: 'w1', quantity: 120, average_cost: 5000 },
    { id: 'p2-w1', productId: 'p2', warehouseId: 'w1', quantity: 80, average_cost: 11000 },
    { id: 'p4-w1', productId: 'p4', warehouseId: 'w1', quantity: 15, average_cost: 18000 },
    { id: 'p1-w2', productId: 'p1', warehouseId: 'w2', quantity: 30, average_cost: 5200 },
];

const initialGoodsReceipts: GoodsReceiptNote[] = [
    { id: 'grn1', doc_number: 'K-0001', supplier_id: 's1', warehouse_id: 'w1', date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), status: DocumentStatus.CONFIRMED, items: [{productId: 'p1', quantity: 100, price: 5000}], paid_amount: 500000 },
    { id: 'grn2', doc_number: 'K-0002', supplier_id: 's2', warehouse_id: 'w1', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), status: DocumentStatus.CONFIRMED, items: [{productId: 'p2', quantity: 200, price: 11500}], paid_amount: 1000000 },
    { id: 'grn3', doc_number: 'K-0003', supplier_id: 's1', warehouse_id: 'w2', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), status: DocumentStatus.CONFIRMED, items: [{productId: 'p5', quantity: 1000, price: 1400}], paid_amount: 0 },
]

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

  // Helpers
  const getTotalStockQuantity = (productId: string, warehouseId: string, currentStock: Stock[] = stock) => {
    const stockItem = currentStock.find(s => s.productId === productId && s.warehouseId === warehouseId);
    return stockItem ? stockItem.quantity : 0;
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

        allDocs.forEach(doc => {
            switch (doc.docType) {
                case 'receipt':
                    doc.items.forEach(item => {
                        const key = `${item.productId}-${doc.warehouse_id}`;
                        const existingStock = stockState.get(key);
                        if (existingStock) {
                            const oldQty = existingStock.quantity;
                            const oldAvgCost = existingStock.average_cost;
                            const newQty = item.quantity;
                            const newPrice = item.price;
                            
                            const totalQty = oldQty + newQty;
                            if (totalQty > 0) {
                                existingStock.average_cost = ((oldQty * oldAvgCost) + (newQty * newPrice)) / totalQty;
                            }
                            existingStock.quantity += newQty;
                        } else {
                            stockState.set(key, {
                                id: key,
                                productId: item.productId,
                                warehouseId: doc.warehouse_id,
                                quantity: item.quantity,
                                average_cost: item.price,
                            });
                        }
                    });
                    break;
                case 'writeoff':
                     doc.items.forEach(item => {
                        const key = `${item.productId}-${doc.warehouse_id}`;
                        const stockItem = stockState.get(key);
                        if (stockItem) {
                            stockItem.quantity -= item.quantity;
                        }
                    });
                    break;
                case 'transfer':
                    doc.items.forEach(item => {
                         const fromKey = `${item.productId}-${doc.from_warehouse_id}`;
                         const fromStock = stockState.get(fromKey);
                         
                         if(fromStock) {
                            const transferCost = fromStock.average_cost; // Cost is determined at time of transfer
                            fromStock.quantity -= item.quantity;
                            
                            const toKey = `${item.productId}-${doc.to_warehouse_id}`;
                            const toStock = stockState.get(toKey);
                            if(toStock) {
                                const oldQty = toStock.quantity;
                                const oldAvgCost = toStock.average_cost;
                                const newQty = item.quantity;
                                
                                const totalQty = oldQty + newQty;
                                if (totalQty > 0) {
                                    toStock.average_cost = ((oldQty * oldAvgCost) + (newQty * transferCost)) / totalQty;
                                }
                                toStock.quantity += newQty;
                            } else {
                                stockState.set(toKey, {
                                    id: toKey,
                                    productId: item.productId,
                                    warehouseId: doc.to_warehouse_id,
                                    quantity: item.quantity,
                                    average_cost: transferCost,
                                });
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
    
    setStock(prevStock => {
        const newStock = [...prevStock];
        note.items.forEach(item => {
            const key = `${item.productId}-${note.warehouse_id}`;
            let stockItem = newStock.find(s => s.id === key);

            const oldQty = stockItem ? stockItem.quantity : 0;
            const oldAvgCost = stockItem ? stockItem.average_cost : 0;
            const newQty = item.quantity;
            const newPrice = item.price;
            
            const totalQty = oldQty + newQty;
            const newAvgCost = totalQty > 0 ? ((oldQty * oldAvgCost) + (newQty * newPrice)) / totalQty : 0;

            if (stockItem) {
                stockItem.quantity = totalQty;
                stockItem.average_cost = newAvgCost;
            } else {
                newStock.push({
                    id: key,
                    productId: item.productId,
                    warehouseId: note.warehouse_id,
                    quantity: newQty,
                    average_cost: newPrice,
                });
            }
        });
        return newStock;
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

  const confirmWriteOff = (noteId: string) => {
    const note = writeOffs.find(n => n.id === noteId);
    if (!note || note.status === DocumentStatus.CONFIRMED) return;

    setStock(prevStock => {
        let tempStock = JSON.parse(JSON.stringify(prevStock)); // Deep copy
        let errors: string[] = [];
        
        note.items.forEach(item => {
            const stockItem = tempStock.find((s: Stock) => s.productId === item.productId && s.warehouseId === note.warehouse_id);

            if (!stockItem || stockItem.quantity < item.quantity) {
                const productName = getProduct(item.productId)?.name || 'Noma\'lum mahsulot';
                errors.push(`"${productName}" mahsuloti omborda yetarli emas!`);
                return;
            }
            stockItem.quantity -= item.quantity;
        });

        if (errors.length > 0) {
            throw new Error(errors.join('\n'));
        }

        setWriteOffs(prev => prev.map(n => n.id === noteId ? { ...n, status: DocumentStatus.CONFIRMED } : n));
        
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
            const fromStock = tempStock.find(s => s.productId === item.productId && s.warehouseId === note.from_warehouse_id);
            
            if (!fromStock || fromStock.quantity < item.quantity) {
                const productName = getProduct(item.productId)?.name;
                errors.push(`"${productName}" jo'natuvchi omborda yetarli emas!`);
                return;
            }
            
            const transferCost = fromStock.average_cost;
            fromStock.quantity -= item.quantity;

            let toStock = tempStock.find(s => s.productId === item.productId && s.warehouseId === note.to_warehouse_id);
            if(toStock) {
                const oldQty = toStock.quantity;
                const oldAvgCost = toStock.average_cost;
                const newQty = item.quantity;
                
                const totalQty = oldQty + newQty;
                toStock.average_cost = totalQty > 0 ? ((oldQty * oldAvgCost) + (newQty * transferCost)) / totalQty : 0;
                toStock.quantity = totalQty;
            } else {
                const newStockItem: Stock = {
                    id: `${item.productId}-${note.to_warehouse_id}`,
                    productId: item.productId,
                    warehouseId: note.to_warehouse_id,
                    quantity: item.quantity,
                    average_cost: transferCost
                };
                tempStock.push(newStockItem);
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
    
    note.items.forEach(item => {
        const difference = item.difference;
        const stockItem = stock.find(s => s.productId === item.productId && s.warehouseId === note.warehouse_id);
        const cost = stockItem ? stockItem.average_cost : 0;
        
        if(difference > 0) { // Ortiqcha
            surplusItems.push({ 
                productId: item.productId, 
                quantity: difference, 
                price: cost, // Use current average cost as price for surplus
            });
        } else if (difference < 0) { // Kamomad
            shortageItems.push({
                productId: item.productId,
                quantity: Math.abs(difference),
                cost: cost,
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
    suppliers, addSupplier, updateSupplier, deleteSupplier, isInnUnique,
    stock, getTotalStockQuantity, getTotalStockAcrossWarehouses, getStockAsOf,
    goodsReceipts, addGoodsReceipt, updateGoodsReceipt, deleteGoodsReceipt, confirmGoodsReceipt, addAndConfirmGoodsReceipt, getNoteTotal,
    writeOffs, addWriteOff, confirmWriteOff,
    internalTransfers, addInternalTransfer, confirmInternalTransfer,
    inventoryNotes, addInventoryNote, confirmInventoryNote,
    payments, addPayment, addDirectPaymentForNote,
    getSupplierBalance,
    checkCreditLimit,
  };
};

export type UseMockDataReturnType = ReturnType<typeof useMockData>;