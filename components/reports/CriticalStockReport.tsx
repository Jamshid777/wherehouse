
import React, { useState, useMemo, useEffect } from 'react';
import { UseMockDataReturnType } from '../../hooks/useMockData';
import { Product, Warehouse, Stock, Unit } from '../../types';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';
import { SearchIcon } from '../icons/SearchIcon';
import { PlusIcon } from '../icons/PlusIcon';

interface StockOverviewReportProps {
    dataManager: UseMockDataReturnType;
    navigate: (view: 'documents', payload: any) => void;
}


// Helpers
const formatCurrency = (amount: number) => new Intl.NumberFormat('uz-UZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
const formatDate = (date: Date) => date.toISOString().split('T')[0];

interface ExpiringProduct extends Stock {
    daysRemaining: number;
    product: Product;
    warehouse: Warehouse;
}

interface LowStockProduct {
    product: Product;
    totalQuantity: number;
    difference: number;
}

export const StockOverviewReport: React.FC<StockOverviewReportProps> = ({ dataManager, navigate }) => {
    // --- STATE & LOGIC FOR BalanceSheetReport part ---
    const [balanceData, setBalanceData] = useState<Stock[] | null>(null);
    const [balanceAsOfDate, setBalanceAsOfDate] = useState(formatDate(new Date()));
    const [balanceIsLoading, setBalanceIsLoading] = useState(true);
    const [balanceExpandedRows, setBalanceExpandedRows] = useState<Set<string>>(new Set());
    const [balanceSearchTerm, setBalanceSearchTerm] = useState('');
    const [balanceSelectedCategory, setBalanceSelectedCategory] = useState('all');
    
    const balanceCategories = useMemo(() => {
        return ['all', ...new Set(dataManager.products.map(p => p.category))];
    }, [dataManager.products]);

    const handleBalanceToggleExpand = (key: string) => {
        setBalanceExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(key)) {
                newSet.delete(key);
            } else {
                newSet.add(key);
            }
            return newSet;
        });
    };

    const handleGenerateBalanceReport = () => {
        setBalanceIsLoading(true);
        setBalanceData(null);
        setTimeout(() => { 
            const data = dataManager.getStockAsOf(balanceAsOfDate);
            setBalanceData(data);
            setBalanceIsLoading(false);
        }, 50);
    };
    
    useEffect(() => {
        handleGenerateBalanceReport();
    }, [balanceAsOfDate, dataManager.stock, dataManager.goodsReceipts, dataManager.writeOffs, dataManager.internalTransfers]);

    const balanceGroupedData = useMemo(() => {
        if (!balanceData) return [];
        const grouped = new Map<string, {product: Product, warehouse: Warehouse, items: Stock[]}>();
        
        balanceData.forEach(stockItem => {
            const product = dataManager.products.find(p => p.id === stockItem.productId);
            const warehouse = dataManager.warehouses.find(w => w.id === stockItem.warehouseId);
            if (!product || !warehouse) return;

            const key = `${product.id}_${warehouse.id}`;
            if (!grouped.has(key)) {
                grouped.set(key, { product, warehouse, items: [] });
            }
            grouped.get(key)!.items.push(stockItem);
        });
        
        const filtered = Array.from(grouped.values())
            .filter(({ product }) => balanceSelectedCategory === 'all' || product.category === balanceSelectedCategory)
            .filter(({ product }) => product.name.toLowerCase().includes(balanceSearchTerm.toLowerCase()));

        return filtered.sort((a,b) => a.product.name.localeCompare(b.product.name));

    }, [balanceData, dataManager.products, dataManager.warehouses, balanceSelectedCategory, balanceSearchTerm]);

    const totalAssets = useMemo(() => {
        if (!balanceGroupedData) return 0;
        let total = 0;
        balanceGroupedData.forEach(({ items }) => {
             total += items.reduce((sum, i) => sum + i.quantity * i.cost, 0);
        });
        return total;
    }, [balanceGroupedData]);
    
    const handleQuickReceipt = (product: Product) => {
        navigate('documents', { type: 'quick-receipt', product });
    };


    // --- STATE & LOGIC FOR CriticalStockReport part ---
    const [criticalReportData, setCriticalReportData] = useState<{ expiring: ExpiringProduct[], lowStock: LowStockProduct[] } | null>(null);
    const [criticalIsLoading, setCriticalIsLoading] = useState(true);
    const criticalAsOfDate = useMemo(() => formatDate(new Date()), []);

    useEffect(() => {
        setCriticalIsLoading(true);
        const currentStock = dataManager.getStockAsOf(criticalAsOfDate);
        
        const targetDate = new Date();
        targetDate.setHours(0, 0, 0, 0);

        const expiring = currentStock
            .filter(s => s.expiry_date && s.quantity > 0)
            .map(s => {
                const expiryDate = new Date(s.expiry_date!);
                const diffTime = expiryDate.getTime() - targetDate.getTime();
                const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const product = dataManager.products.find(p => p.id === s.productId);
                const warehouse = dataManager.warehouses.find(w => w.id === s.warehouseId);

                return { ...s, daysRemaining, product, warehouse };
            })
            .filter((s): s is ExpiringProduct => s.daysRemaining <= 30 && !!s.product && !!s.warehouse)
            .sort((a, b) => a.daysRemaining - b.daysRemaining);

        const stockByProduct = new Map<string, number>();
        currentStock.forEach(s => {
            stockByProduct.set(s.productId, (stockByProduct.get(s.productId) || 0) + s.quantity);
        });

        const lowStock = dataManager.products
            .map(product => {
                const totalQuantity = stockByProduct.get(product.id) || 0;
                return {
                    product,
                    totalQuantity,
                    difference: totalQuantity - product.min_stock,
                };
            })
            .filter(item => item.difference < 0)
            .sort((a, b) => a.difference - b.difference);
            
        setCriticalReportData({ expiring, lowStock });
        setCriticalIsLoading(false);
    }, [dataManager.stock, dataManager.goodsReceipts, dataManager.writeOffs, dataManager.internalTransfers]);

    const getDaysRemainingClass = (days: number) => {
        if (days < 0) return 'bg-gray-500 text-white';
        if (days <= 7) return 'bg-red-100 text-red-800';
        if (days <= 15) return 'bg-yellow-100 text-yellow-800';
        return 'bg-amber-100 text-amber-800';
    };

     const getDaysRemainingText = (days: number) => {
        if (days < 0) return `Muddati o'tgan`;
        if (days === 0) return `Bugun`;
        return `${days} kun`;
    };

    return (
        <div className="space-y-8">
            {/* Balance Sheet Report UI */}
            <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                    <h2 className="text-2xl font-bold text-slate-800">Balans Hisoboti</h2>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                         <div className="relative w-full md:w-56">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Mahsulot qidirish..."
                                value={balanceSearchTerm}
                                onChange={(e) => setBalanceSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition text-sm"
                            />
                        </div>
                         <select 
                            value={balanceSelectedCategory} 
                            onChange={e => setBalanceSelectedCategory(e.target.value)}
                            className="w-full md:w-48 px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition text-sm"
                        >
                            {balanceCategories.map(cat => <option key={cat} value={cat}>{cat === 'all' ? 'Barcha kategoriyalar' : cat}</option>)}
                        </select>
                         <input
                            type="date"
                            id="asOfDate"
                            value={balanceAsOfDate}
                            onChange={e => setBalanceAsOfDate(e.target.value)}
                            className="px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500 text-sm"
                        />
                    </div>
                </div>

                {balanceIsLoading && <div className="text-center py-8">Yuklanmoqda...</div>}

                {!balanceIsLoading && balanceData && (
                    <div className="space-y-4">
                        <div className="overflow-x-auto border rounded-lg">
                            <table className="w-full text-sm border-collapse">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50 tracking-wider">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium w-[5%] border-r border-slate-200"></th>
                                        <th className="px-4 py-3 text-left font-medium border-r border-slate-200">Mahsulot / Ombor</th>
                                        <th className="px-4 py-3 text-left font-medium border-r border-slate-200">Kategoriya</th>
                                        <th className="px-4 py-3 text-right font-medium border-r border-slate-200">Miqdor</th>
                                        <th className="px-4 py-3 text-right font-medium border-r border-slate-200">Tannarx (O'rtacha)</th>
                                        <th className="px-4 py-3 text-right font-medium border-r border-slate-200">Jami Summa</th>
                                        <th className="px-4 py-3 text-center font-medium"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {balanceGroupedData.length > 0 ? balanceGroupedData.map(({ product, warehouse, items }) => {
                                        const key = `${product.id}-${warehouse.id}`;
                                        const isExpanded = balanceExpandedRows.has(key);
                                        const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);
                                        const totalValue = items.reduce((sum, i) => sum + i.quantity * i.cost, 0);
                                        const avgCost = totalQty > 0 ? totalValue / totalQty : 0;

                                        return (
                                            <React.Fragment key={key}>
                                                <tr onClick={() => handleBalanceToggleExpand(key)} className="cursor-pointer hover:bg-slate-50" title="Batafsil ko'rish uchun bosing">
                                                    <td className="px-4 py-3 text-center border-r border-slate-200">
                                                        <ChevronDownIcon className={`h-5 w-5 text-slate-400 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                                                    </td>
                                                    <td className="px-4 py-3 font-medium text-slate-900 border-r border-slate-200">
                                                        <div>
                                                            {product.name}
                                                            <span className="ml-2 text-xs text-slate-500 font-normal">({warehouse.name})</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-600 border-r border-slate-200">{product.category}</td>
                                                    <td className="px-4 py-3 text-right font-mono font-semibold text-slate-800 border-r border-slate-200">{totalQty.toFixed(2)} <span className="text-xs text-slate-500">{product.unit}</span></td>
                                                    <td className="px-4 py-3 text-right font-mono text-slate-600 border-r border-slate-200">{formatCurrency(avgCost)}</td>
                                                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-800 border-r border-slate-200">{formatCurrency(totalValue)}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <button onClick={(e) => { e.stopPropagation(); handleQuickReceipt(product); }} title="Tezkor kirim" className="p-1.5 rounded-full text-amber-600 hover:bg-amber-100 transition-colors">
                                                            <PlusIcon className="h-5 w-5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                                {isExpanded && (
                                                    <tr>
                                                        <td colSpan={7} className="p-0">
                                                            <div className="bg-slate-50/70 px-4 py-2">
                                                                <table className="w-full text-xs border-collapse">
                                                                    <thead className="text-slate-500">
                                                                        <tr>
                                                                            <th className="px-4 py-1 text-left font-medium pl-8 border-r border-slate-200">Partiya</th>
                                                                            <th className="px-4 py-1 text-left font-medium border-r border-slate-200">Yaroqlilik Muddati</th>
                                                                            <th className="px-4 py-1 text-right font-medium border-r border-slate-200">Miqdor</th>
                                                                            <th className="px-4 py-1 text-right font-medium border-r border-slate-200">Tannarx</th>
                                                                            <th className="px-4 py-1 text-right font-medium">Summa</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {items.sort((a,b) => new Date(a.received_date).getTime() - new Date(b.received_date).getTime()).map(stockItem => (
                                                                            <tr key={stockItem.id}>
                                                                                <td className="px-4 py-1.5 pl-8 font-medium border-r border-slate-200">{stockItem.batch_number}</td>
                                                                                <td className="px-4 py-1.5 border-r border-slate-200">{stockItem.expiry_date ? new Date(stockItem.expiry_date).toLocaleDateString() : 'Muddatsiz'}</td>
                                                                                <td className="px-4 py-1.5 text-right font-mono border-r border-slate-200">{stockItem.quantity.toFixed(2)}</td>
                                                                                <td className="px-4 py-1.5 text-right font-mono border-r border-slate-200">{formatCurrency(stockItem.cost)}</td>
                                                                                <td className="px-4 py-1.5 text-right font-mono">{formatCurrency(stockItem.quantity * stockItem.cost)}</td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    }) : (
                                        <tr>
                                            <td colSpan={7} className="text-center py-10 text-slate-500">Ma'lumot topilmadi.</td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot className="bg-slate-100 font-bold">
                                    <tr>
                                        <td colSpan={5} className="px-4 py-4 text-right text-base border-r border-slate-200">Jami Aktivlar:</td>
                                        <td className="px-4 py-4 text-right font-mono text-lg text-slate-900 border-r border-slate-200">{formatCurrency(totalAssets)}</td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Critical Stock Report UI */}
            <div className="bg-white p-6 rounded-xl shadow-md">
                 <h2 className="text-2xl font-bold text-slate-800 mb-4">Kritik Qoldiqlar Hisoboti ({new Date(criticalAsOfDate).toLocaleDateString('uz-UZ')})</h2>
                 
                 {criticalIsLoading && <div className="text-center py-10">Yuklanmoqda...</div>}

                 {!criticalIsLoading && criticalReportData && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                         {/* Expiring Products Section */}
                         <div className="space-y-4">
                             <h3 className="text-xl font-semibold text-slate-700 border-b pb-2">Muddati Yaqinlashayotgan Mahsulotlar</h3>
                             <div className="overflow-x-auto border rounded-lg max-h-[60vh]">
                                 {criticalReportData.expiring.length > 0 ? (
                                     <table className="w-full text-sm border-collapse">
                                         <thead className="text-xs text-slate-500 uppercase bg-slate-50 tracking-wider sticky top-0">
                                             <tr>
                                                 <th className="px-4 py-3 text-left font-medium border-r border-slate-200">Mahsulot / Partiya</th>
                                                 <th className="px-4 py-3 text-left font-medium border-r border-slate-200">Ombor</th>
                                                 <th className="px-4 py-3 text-right font-medium border-r border-slate-200">Miqdor</th>
                                                 <th className="px-4 py-3 text-center font-medium">Qolgan kun</th>
                                             </tr>
                                         </thead>
                                         <tbody className="divide-y divide-slate-200">
                                             {criticalReportData.expiring.map(item => (
                                                 <tr key={item.id} className="hover:bg-slate-50">
                                                     <td className="px-4 py-3 border-r border-slate-200">
                                                         <div className="font-medium text-slate-900">{item.product.name}</div>
                                                         <div className="text-xs text-slate-500">Partiya: {item.batch_number}</div>
                                                     </td>
                                                     <td className="px-4 py-3 text-slate-600 border-r border-slate-200">{item.warehouse.name}</td>
                                                     <td className="px-4 py-3 text-right font-mono text-slate-600 border-r border-slate-200">{item.quantity.toFixed(2)} {item.product.unit}</td>
                                                     <td className="px-4 py-3 text-center">
                                                         <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${getDaysRemainingClass(item.daysRemaining)}`}>
                                                             {getDaysRemainingText(item.daysRemaining)}
                                                         </span>
                                                     </td>
                                                 </tr>
                                             ))}
                                         </tbody>
                                     </table>
                                 ) : (
                                     <div className="text-center py-10 text-slate-500">
                                         Muddati yaqinlashayotgan mahsulotlar mavjud emas.
                                     </div>
                                 )}
                             </div>
                         </div>
 
                         {/* Low Stock Products Section */}
                         <div className="space-y-4">
                             <h3 className="text-xl font-semibold text-slate-700 border-b pb-2">Minimal Zaxiradan Kam Mahsulotlar</h3>
                             <div className="overflow-x-auto border rounded-lg max-h-[60vh]">
                                 {criticalReportData.lowStock.length > 0 ? (
                                     <table className="w-full text-sm border-collapse">
                                         <thead className="text-xs text-slate-500 uppercase bg-slate-50 tracking-wider sticky top-0">
                                             <tr>
                                                 <th className="px-4 py-3 text-left font-medium border-r border-slate-200">Mahsulot</th>
                                                 <th className="px-4 py-3 text-right font-medium border-r border-slate-200">Min. Zaxira</th>
                                                 <th className="px-4 py-3 text-right font-medium border-r border-slate-200">Haqiqiy Qoldiq</th>
                                                 <th className="px-4 py-3 text-right font-medium">Farq</th>
                                             </tr>
                                         </thead>
                                         <tbody className="divide-y divide-slate-200">
                                             {criticalReportData.lowStock.map(item => (
                                                 <tr key={item.product.id} className="hover:bg-slate-50">
                                                     <td className="px-4 py-3 font-medium text-slate-900 border-r border-slate-200">{item.product.name}</td>
                                                     <td className="px-4 py-3 text-right font-mono text-slate-600 border-r border-slate-200">{item.product.min_stock.toFixed(2)} {item.product.unit}</td>
                                                     <td className="px-4 py-3 text-right font-mono text-slate-600 border-r border-slate-200">{item.totalQuantity.toFixed(2)} {item.product.unit}</td>
                                                     <td className="px-4 py-3 text-right font-mono font-bold text-red-600">
                                                         {item.difference.toFixed(2)}
                                                     </td>
                                                 </tr>
                                             ))}
                                         </tbody>
                                     </table>
                                 ) : (
                                     <div className="text-center py-10 text-slate-500">
                                         Minimal zaxiradan kam mahsulotlar mavjud emas.
                                     </div>
                                 )}
                             </div>
                         </div>
                     </div>
                 )}
            </div>
        </div>
    );
};
