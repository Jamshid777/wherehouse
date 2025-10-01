export enum Unit {
  KG = 'kg',
  L = 'l',
  DONA = 'dona',
  PORTSIYA = 'portsiya',
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: Unit;
  min_stock: number;
}

export interface Warehouse {
  id:string;
  name: string;
  is_active: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  inn?: string;
  phone?: string;
  address?: string;
  initial_balance: number;
}

// ===============================================
// NEW TYPES FOR DOCUMENTS AND STOCK MANAGEMENT
// ===============================================

export enum DocumentStatus {
  DRAFT = 'draft',
  CONFIRMED = 'confirmed',
}

// Stock is now managed by batch. Each record represents a specific batch of a product in a warehouse.
export interface Stock {
  batchId: string; // Unique ID for each batch, e.g., grn1-item1 or prod-wo123-d1
  productId?: string; // For raw materials
  dishId?: string; // For finished goods
  warehouseId: string;
  quantity: number;
  cost: number; // Cost at the time of receipt for this specific batch
  receiptDate: string; // ISO string format of the receipt date, crucial for FIFO
  validDate?: string; // Optional expiry date for the batch
}


// 3.1 Kirim Hujjati (Goods Receipt Note)
export interface GoodsReceiptItem {
  productId: string;
  quantity: number;
  price: number;
  batchId: string; // Auto-generated ID for the batch being received
  validDate: string; // Expiry date for the batch
}

export interface GoodsReceiptNote {
  id: string;
  doc_number: string;
  supplier_id: string;
  warehouse_id: string;
  date: string; // ISO string format
  status: DocumentStatus;
  items: GoodsReceiptItem[];
  type?: 'receipt' | 'inventory_surplus';
  paid_amount: number; // For accounts payable tracking
  payment_method?: PaymentMethod; // Temporary holder for payment on creation
}

// 3.2 Chiqim Hujjati (Write-off Act)
export enum WriteOffReason {
  SPOILAGE = 'Buzilish',
  LOSS = 'Yo\'qotish',
  STAFF_MEALS = 'Xodimlar ovqati',
  INVENTORY_SHORTAGE = 'Kamomad (Inventarizatsiya)',
  OTHER = 'Boshqa',
}

export interface WriteOffItem {
  productId: string;
  quantity: number;
  cost: number; // captured from FIFO-consumed batches
  consumedBatches?: {
      batchId: string;
      receiptDate: string;
      cost: number;
      quantityConsumed: number;
  }[];
}

export interface WriteOffNote {
  id: string;
  doc_number: string;
  warehouse_id: string;
  reason: WriteOffReason;
  date: string;
  status: DocumentStatus;
  items: WriteOffItem[];
}

// 3.3 Ichki ko'chirish hujjati (Internal Transfer Note)
export interface InternalTransferItem {
  productId: string;
  quantity: number;
}

export interface InternalTransferNote {
  id: string;
  doc_number: string;
  from_warehouse_id: string;
  to_warehouse_id: string;
  date: string;
  status: DocumentStatus;
  items: InternalTransferItem[];
}


// 3.4 Inventarizatsiya hujjati (Inventory Count Sheet)
export interface InventoryItem {
    productId: string;
    planned_quantity: number;
    real_quantity: number;
    difference: number;
}

export interface InventoryNote {
    id: string;
    doc_number: string;
    warehouse_id: string;
    date: string;
    status: DocumentStatus;
    items: InventoryItem[];
}

// 3.5 Yetkazib beruvchiga qaytarish (Goods Return Note)
export interface GoodsReturnItem {
  productId: string;
  quantity: number;
  cost: number; // captured from FIFO-consumed batches at the time of return
  consumedBatches?: {
    batchId: string;
    receiptDate: string;
    cost: number;
    quantityConsumed: number;
  }[];
}

export interface GoodsReturnNote {
  id: string;
  doc_number: string;
  supplier_id: string;
  warehouse_id: string;
  date: string;
  status: DocumentStatus;
  items: GoodsReturnItem[];
}


// 3.6 Yetkazib beruvchiga to'lov (Payment)
export enum PaymentMethod {
  BANK = "Bank o'tkazmasi",
  CASH = 'Naqd pul',
  TERMINAL = 'Terminal',
}

export enum PaymentStatus {
    UNPAID = 'unpaid',
    PARTIALLY_PAID = 'partially_paid',
    PAID = 'paid',
}

export interface PaymentLink {
    grnId: string;
    amountApplied: number;
}

export interface Payment {
    id:string;
    doc_number: string;
    date: string;
    supplier_id: string;
    amount: number;
    payment_method: PaymentMethod;
    links: PaymentLink[];
    comment: string;
}

// 3.7 Narxni Korrektirovka Qilish Hujjati (Price Adjustment Note)
export interface PriceAdjustmentItem {
    productId: string;
    batchId: string; // From GoodsReceiptItem
    originalQuantity: number; // From GoodsReceiptItem, for balance calculation
    oldPrice: number;
    newPrice: number;
    reason: string;
}

export interface PriceAdjustmentNote {
    id: string;
    doc_number: string;
    date: string; // ISO string format
    status: DocumentStatus;
    goodsReceiptNoteId: string;
    supplier_id: string;
    warehouse_id: string;
    items: PriceAdjustmentItem[];
}

// 3.8 Ishlab Chiqarish Hujjati (Production Note)
export interface ProductionProducedItem {
  dishId: string;
  quantity: number;
  cost: number; // calculated cost of goods produced
}

export interface ProductionNote {
  id: string;
  doc_number: string;
  warehouse_id: string;
  date: string; // ISO string format
  status: DocumentStatus;
  consumedItems: WriteOffItem[]; // Ingredients consumed
  producedItems: ProductionProducedItem[]; // Dishes produced
}


// ===============================================
// NEW TYPES FOR PRODUCTION
// ===============================================
export interface RecipeItem {
  productId: string;
  grossQuantity: number;
  netQuantity: number;
}

export interface Recipe {
  dishId: string;
  items: RecipeItem[];
  outputYield: number;
  unit: Unit;
}

export interface Dish {
  id: string;
  name: string;
  category: string;
  price: number;
}

// ===============================================
// NEW TYPES FOR SALES
// ===============================================

export interface Client {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  is_active: boolean;
  initial_balance: number; // >0 if client owes us, <0 if we owe them
}

export interface ClientPaymentLink {
    invoiceId: string;
    amountApplied: number;
}

export interface ClientPayment {
    id:string;
    doc_number: string;
    date: string;
    client_id: string;
    amount: number;
    payment_method: PaymentMethod;
    links: ClientPaymentLink[];
    comment: string;
}

export interface SalesInvoiceItem {
  dishId: string;
  quantity: number;
  price: number; // Sale price
  cost: number; // COGS, calculated on confirmation
}

export interface SalesInvoice {
  id: string;
  doc_number: string;
  client_id: string;
  warehouse_id: string;
  date: string; // ISO string format
  status: DocumentStatus;
  items: SalesInvoiceItem[];
  paid_amount: number; // For accounts receivable tracking
  payment_method?: PaymentMethod; // Temporary holder for payment on creation
}


export enum SalesReturnReason {
  RETURN_TO_STOCK = 'Qayta sotuvga (Sifatli)',
  WRITE_OFF = 'Hisobdan chiqarish (Sifatsiz)',
}

export interface SalesReturnItem {
  dishId: string;
  quantity: number;
  price: number; // Qaytarish vaqtidagi sotuv narxi (original SalesInvoice'dan olinadi)
  cost: number; // Qaytarish vaqtidagi tannarx (original SalesInvoice'dan olinadi)
}

export interface SalesReturnNote {
  id: string;
  doc_number: string;
  client_id: string;
  warehouse_id: string;
  date: string; // ISO string format
  status: DocumentStatus;
  reason: SalesReturnReason;
  items: SalesReturnItem[];
  original_invoice_id?: string; // (Optional) Qaysi sotuv hujjatiga asosan qaytarilayotgani
}


// ===============================================
// NEW TYPES FOR EXPENSES
// ===============================================

export interface ExpenseCategory {
  id: string;
  name: string;
}

export interface Employee {
  id: string;
  name: string;
  is_active: boolean;
}

export interface Expense {
  id: string;
  date: string; // ISO string format
  categoryId: string;
  amount: number;
  comment?: string;
  employeeId?: string;
}