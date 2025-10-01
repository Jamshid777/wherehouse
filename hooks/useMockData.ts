import { useState, useEffect } from 'react';
import { 
    Product, Warehouse, Supplier, Stock, GoodsReceiptNote, WriteOffNote, 
    InternalTransferNote, InventoryNote, Payment, GoodsReturnNote, Dish, 
    Recipe, PriceAdjustmentNote, Client, SalesInvoice, ClientPayment, 
    ExpenseCategory, Expense, DocumentStatus, ProductionNote, SalesReturnNote,
    Employee
} from '../types';
import { useProductData } from './data/useProductData';
import { useWarehouseData } from './data/useWarehouseData';
import { useSupplierData } from './data/useSupplierData';
import { useClientData } from './data/useClientData';
import { useDishData } from './data/useDishData';
import { useExpenseData } from './data/useExpenseData';
import { useStockData } from './data/useStockData';
import { useSupplierDocuments } from './data/useSupplierDocuments';
import { useInternalDocuments } from './data/useInternalDocuments';
import { useSalesDocuments } from './data/useSalesDocuments';
import { useEmployeeData } from './data/useEmployeeData';

// Define the structure for stored data
interface AppData {
    products: Product[];
    warehouses: Warehouse[];
    suppliers: Supplier[];
    stock: Stock[];
    goodsReceipts: GoodsReceiptNote[];
    writeOffs: WriteOffNote[];
    internalTransfers: InternalTransferNote[];
    inventoryNotes: InventoryNote[];
    payments: Payment[];
    goodsReturns: GoodsReturnNote[];
    priceAdjustments: PriceAdjustmentNote[];
    dishes: Dish[];
    recipes: Recipe[];
    clients: Client[];
    salesInvoices: SalesInvoice[];
    clientPayments: ClientPayment[];
    salesReturns: SalesReturnNote[];
    expenseCategories: ExpenseCategory[];
    expenses: Expense[];
    employees: Employee[];
    productionNotes: ProductionNote[];
}

// Define the default data for first-time use
const getDefaultData = (): AppData => ({
    products: [
        { id: 'p1', name: 'Lavash xamiri', sku: 'SKU-001', category: 'Xamir mahsulotlari', unit: 'dona' as any, min_stock: 10 },
        { id: 'p2', name: 'Burger bulochkasi', sku: 'SKU-002', category: 'Non mahsulotlari', unit: 'dona' as any, min_stock: 10 },
        { id: 'p3', name: 'Mol go‘shti kotleti', sku: 'SKU-003', category: 'Go‘sht', unit: 'dona' as any, min_stock: 10 },
        { id: 'p4', name: 'Tovuq filesi', sku: 'SKU-004', category: 'Go‘sht', unit: 'kg' as any, min_stock: 10 },
        { id: 'p5', name: 'Tovuq shawarma go‘shti', sku: 'SKU-005', category: 'Go‘sht', unit: 'kg' as any, min_stock: 10 },
        { id: 'p6', name: 'Sosiska (hot-dog uchun)', sku: 'SKU-006', category: 'Go‘sht', unit: 'dona' as any, min_stock: 10 },
        { id: 'p7', name: 'Pomidor', sku: 'SKU-007', category: 'Sabzavotlar', unit: 'kg' as any, min_stock: 10 },
        { id: 'p8', name: 'Bodring (tuzlangan)', sku: 'SKU-008', category: 'Sabzavotlar', unit: 'kg' as any, min_stock: 10 },
        { id: 'p9', name: 'Piyoz (halqa)', sku: 'SKU-009', category: 'Sabzavotlar', unit: 'kg' as any, min_stock: 10 },
        { id: 'p10', name: 'Salat bargi (Iceberg)', sku: 'SKU-010', category: 'Sabzavotlar', unit: 'dona' as any, min_stock: 10 },
        { id: 'p11', name: 'Jalapeno (achchiq qalampir)', sku: 'SKU-011', category: 'Sabzavotlar', unit: 'kg' as any, min_stock: 10 },
        { id: 'p12', name: 'Qo‘ziqorin (konserva)', sku: 'SKU-012', category: 'Sabzavotlar', unit: 'kg' as any, min_stock: 10 },
        { id: 'p13', name: 'Pishloq (Cheddar)', sku: 'SKU-013', category: 'Sut mahsulotlari', unit: 'dona' as any, min_stock: 10 },
        { id: 'p14', name: 'Mozzarella pishlog‘i', sku: 'SKU-014', category: 'Sut mahsulotlari', unit: 'kg' as any, min_stock: 10 },
        { id: 'p15', name: 'Kartoshka fri', sku: 'SKU-015', category: 'Muzlatilgan', unit: 'kg' as any, min_stock: 10 },
        { id: 'p16', name: 'Ketchup', sku: 'SKU-016', category: 'Souslar', unit: 'l' as any, min_stock: 10 },
        { id: 'p17', name: 'Mayonez', sku: 'SKU-017', category: 'Souslar', unit: 'l' as any, min_stock: 10 },
        { id: 'p18', name: 'Barbekyu sous', sku: 'SKU-018', category: 'Souslar', unit: 'l' as any, min_stock: 10 },
        { id: 'p19', name: 'Chili sous', sku: 'SKU-019', category: 'Souslar', unit: 'l' as any, min_stock: 10 },
        { id: 'p20', name: 'Sarimsoq sous', sku: 'SKU-020', category: 'Souslar', unit: 'l' as any, min_stock: 10 },
        { id: 'p21', name: 'Ranch sous', sku: 'SKU-021', category: 'Souslar', unit: 'l' as any, min_stock: 10 },
        { id: 'p22', name: 'Yengil tortilla', sku: 'SKU-022', category: 'Xamir mahsulotlari', unit: 'dona' as any, min_stock: 10 },
        { id: 'p23', name: 'Choy paketlari', sku: 'SKU-023', category: 'Ichimliklar', unit: 'dona' as any, min_stock: 10 },
        { id: 'p24', name: 'Qahva kapsulasi/donasi', sku: 'SKU-024', category: 'Ichimliklar', unit: 'dona' as any, min_stock: 10 },
    ],
    warehouses: [],
    suppliers: [],
    stock: [],
    goodsReceipts: [],
    writeOffs: [],
    internalTransfers: [],
    inventoryNotes: [],
    payments: [],
    goodsReturns: [],
    priceAdjustments: [],
    dishes: [
        { id: 'd1', name: 'Lavash oddiy', category: 'Lavashlar', price: 20000 },
        { id: 'd2', name: 'Burger', category: 'Burgerlar', price: 25000 },
    ],
    recipes: [
        {
            dishId: 'd1',
            outputYield: 1,
            unit: 'portsiya' as any,
            items: [
                { productId: 'p1', grossQuantity: 1, netQuantity: 1 },
                { productId: 'p5', grossQuantity: 0.1, netQuantity: 0.08 },
                { productId: 'p7', grossQuantity: 0.05, netQuantity: 0.04 },
            ]
        },
        {
            dishId: 'd2',
            outputYield: 1,
            unit: 'portsiya' as any,
            items: [
                { productId: 'p2', grossQuantity: 1, netQuantity: 1 },
                { productId: 'p3', grossQuantity: 1, netQuantity: 1 },
                { productId: 'p13', grossQuantity: 1, netQuantity: 1 },
            ]
        }
    ],
    clients: [],
    salesInvoices: [],
    clientPayments: [],
    salesReturns: [],
    expenseCategories: [
        { id: 'ec1', name: 'Ijara' },
        { id: 'ec2', name: 'Oylik maosh' },
        { id: 'ec3', name: 'Kommunal to\'lovlar' },
        { id: 'ec4', name: 'Soliq' },
        { id: 'ec5', name: 'Boshqa harajatlar' },
    ],
    expenses: [],
    employees: [
        { id: 'emp1', name: 'Ali Valiyev', is_active: true },
        { id: 'emp2', name: 'Vali Aliyev', is_active: true },
    ],
    productionNotes: [],
});

const LOCAL_STORAGE_KEY = 'ombor_nazorati_data_v1';

const loadDataFromStorage = (): AppData => {
    try {
        const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedData) {
            const parsedData = JSON.parse(storedData);
            const defaultData = getDefaultData();
            return { ...defaultData, ...parsedData };
        }
    } catch (error) {
        console.error("Error loading data from localStorage:", error);
    }
    return getDefaultData();
};

export const useMockData = () => {
  const [initialData] = useState(loadDataFromStorage);

  // State slices
  const { dishes, setDishes, recipes, setRecipes, ...dishOps } = useDishData(initialData.dishes, initialData.recipes);
  const { products, setProducts, ...productOps } = useProductData(initialData.products, recipes);
  const { warehouses, setWarehouses, ...warehouseOps } = useWarehouseData(initialData.warehouses);
  
  const { stock, setStock, ...stockOps } = useStockData(initialData.stock);

  const { goodsReceipts, setGoodsReceipts, goodsReturns, setGoodsReturns, payments, setPayments, priceAdjustments, setPriceAdjustments, ...supplierDocOps } = useSupplierDocuments({
    initialData, stock, setStock, consumeStockByFIFO: stockOps.consumeStockByFIFO
  });

  const { internalTransfers, setInternalTransfers, inventoryNotes, setInventoryNotes, writeOffs, setWriteOffs, productionNotes, setProductionNotes, ...internalDocOps } = useInternalDocuments({
    initialData, stock, setStock, products, goodsReceipts, setGoodsReceipts, payments, setPayments, consumeStockByFIFO: stockOps.consumeStockByFIFO, recipes, dishes
  });
  
  const { salesInvoices, setSalesInvoices, clientPayments, setClientPayments, salesReturns, setSalesReturns, ...salesDocOps } = useSalesDocuments({
      initialData, stock, setStock, products, dishes, recipes, consumeStockByFIFO: stockOps.consumeStockByFIFO
  });

  const { suppliers, setSuppliers, ...supplierOps } = useSupplierData({ initialSuppliers: initialData.suppliers, goodsReceipts, payments, goodsReturns, priceAdjustments, suppliers: initialData.suppliers, getNoteTotal: supplierDocOps.getNoteTotal });
  const { clients, setClients, ...clientOps } = useClientData({ initialClients: initialData.clients, salesInvoices, clientPayments, salesReturns, getClientInvoiceTotal: salesDocOps.getClientInvoiceTotal });
  const { expenseCategories, setExpenseCategories, expenses, setExpenses, ...expenseOps } = useExpenseData(initialData.expenseCategories, initialData.expenses);
  const { employees, setEmployees, ...employeeOps } = useEmployeeData({ initialEmployees: initialData.employees, expenses });
  
    const getStockAsOf = (targetDateStr: string): Stock[] => {
        const targetDate = new Date(targetDateStr);
        targetDate.setHours(23, 59, 59, 999);

        const allDocs: any[] = [
            ...goodsReceipts.map(d => ({ ...d, docType: 'receipt', date: new Date(d.date) })),
            ...writeOffs.map(d => ({ ...d, docType: 'writeoff', date: new Date(d.date) })),
            ...internalTransfers.map(d => ({ ...d, docType: 'transfer', date: new Date(d.date) })),
            ...goodsReturns.map(d => ({ ...d, docType: 'return', date: new Date(d.date) })),
            ...priceAdjustments.map(d => ({ ...d, docType: 'price_adjustment', date: new Date(d.date) })),
            ...productionNotes.map(d => ({ ...d, docType: 'production', date: new Date(d.date) })),
            ...salesInvoices.map(d => ({ ...d, docType: 'sales', date: new Date(d.date) })),
        ]
        .filter(d => d.status === DocumentStatus.CONFIRMED && new Date(d.date) <= targetDate)
        .sort((a, b) => a.date.getTime() - b.date.getTime());
        
        let historicalStock: Stock[] = [];

        for (const doc of allDocs) {
            switch (doc.docType) {
                case 'receipt':
                    doc.items.forEach((item: any) => {
                        historicalStock.push({
                            batchId: item.batchId,
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
                    doc.items.forEach((item: any) => {
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
                
                case 'sales':
                    doc.items.forEach((item: any) => {
                        let qtyToConsume = item.quantity;
                        const dishBatches = historicalStock
                            .filter(s => s.dishId === item.dishId && s.warehouseId === doc.warehouse_id)
                            .sort((a,b) => new Date(a.receiptDate).getTime() - new Date(b.receiptDate).getTime());
                        
                        for (const batch of dishBatches) {
                            if (qtyToConsume <= 0) break;
                            const consumeAmount = Math.min(qtyToConsume, batch.quantity);
                            batch.quantity -= consumeAmount;
                            qtyToConsume -= consumeAmount;
                        }
                    });
                    historicalStock = historicalStock.filter(s => s.quantity > 0.001);
                    break;

                case 'production':
                    // 1. Consume raw materials
                    doc.consumedItems.forEach((item: any) => {
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

                    // 2. Add produced dishes
                    doc.producedItems.forEach((item: any) => {
                        historicalStock.push({
                            batchId: `prod-${doc.id}-${item.dishId}`,
                            dishId: item.dishId,
                            warehouseId: doc.warehouse_id,
                            quantity: item.quantity,
                            cost: item.cost,
                            receiptDate: doc.date.toISOString(),
                        });
                    });
                    break;

                case 'transfer':
                    doc.items.forEach((item: any) => {
                        let qtyToTransfer = item.quantity;
                        const productBatches = historicalStock
                            .filter(s => s.productId === item.productId && s.warehouseId === doc.from_warehouse_id)
                            .sort((a,b) => new Date(a.receiptDate).getTime() - new Date(b.receiptDate).getTime());
                        
                        for (const batch of productBatches) {
                            if (qtyToTransfer <= 0) break;
                            const transferAmount = Math.min(qtyToTransfer, batch.quantity);
                            batch.quantity -= transferAmount;
                            qtyToTransfer -= transferAmount;

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
                case 'price_adjustment':
                    doc.items.forEach((item: any) => {
                        const batchToAdjust = historicalStock.find(s => s.batchId === item.batchId);
                        if (batchToAdjust) {
                            batchToAdjust.cost = item.newPrice;
                        }
                    });
                    break;
            }
        }
        return historicalStock;
    };

  // Data Persistence
  useEffect(() => {
    try {
        const appData: AppData = {
            products, warehouses, suppliers, stock, goodsReceipts, writeOffs, 
            internalTransfers, inventoryNotes, payments, goodsReturns, priceAdjustments,
            dishes, recipes, clients, salesInvoices, clientPayments, salesReturns, expenseCategories, expenses,
            employees, productionNotes,
        };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(appData));
    } catch (error) {
        console.error("Error saving data to localStorage:", error);
    }
  }, [
    products, warehouses, suppliers, stock, goodsReceipts, writeOffs, 
    internalTransfers, inventoryNotes, payments, goodsReturns, priceAdjustments, dishes, recipes,
    clients, salesInvoices, clientPayments, salesReturns, expenseCategories, expenses, employees, productionNotes
  ]);

  return {
    // State
    products,
    warehouses,
    suppliers,
    stock,
    goodsReceipts,
    writeOffs,
    internalTransfers,
    inventoryNotes,
    payments,
    goodsReturns,
    priceAdjustments,
    dishes,
    recipes,
    clients,
    salesInvoices,
    clientPayments,
    salesReturns,
    expenseCategories,
    expenses,
    employees,
    productionNotes,

    // Operations
    ...productOps,
    ...warehouseOps,
    ...supplierOps,
    ...clientOps,
    ...dishOps,
    ...expenseOps,
    ...employeeOps,
    ...stockOps,
    ...supplierDocOps,
    ...internalDocOps,
    ...salesDocOps,
    getStockAsOf,
  };
};

export type UseMockDataReturnType = ReturnType<typeof useMockData>;