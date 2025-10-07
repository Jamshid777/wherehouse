import React, { useState, useMemo, useEffect } from 'react';
import { UseMockDataReturnType } from '../../hooks/useMockData';
import { Product, Warehouse, Stock, Unit, Dish, Recipe } from '../../types';
import { SearchIcon } from '../icons/SearchIcon';
import { PlusIcon } from '../icons/PlusIcon';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';
import { ProductTurnoverModal } from './ProductTurnoverModal';

interface StockOverviewReportProps {
    dataManager: UseMockDataReturnType;
    navigate: (view: 'documents', payload: any) => void;
    defaultWarehouseId: string | null;
    appMode: 'pro' | 'lite';
}

// Helpers
const formatCurrency = (amount: number) => new Intl.NumberFormat('uz-UZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
const formatDate = (date: Date) => date.toISOString().split('T')[0];

interface LowStockProduct {
    product: Product;
    totalQuantity: number;
    difference: number;
}

interface StockableItem {
    id: string;
    name: string;
    category: string;
    unit: Unit;
    type: 'product' | 'dish';
}

interface GroupedStockData {
    item: StockableItem;
    warehouse: Warehouse;
    totalQty: number;
    totalValue: number;
    batches: Stock[];
}

export const StockOverviewReport: React.FC<StockOverviewReportProps> = ({ dataManager, navigate, defaultWarehouseId, appMode }) => {
    const [balanceData, setBalanceData] = useState<Stock[] | null>(null);
    const [lowStockReportData, setLowStockReportData] = useState<LowStockProduct[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [turnoverModalData, setTurnoverModalData] = useState<{ product: Product, warehouse: Warehouse } | null>(null);

    const [filters, setFilters] = useState({
        asOfDate: formatDate(new Date()),
        searchTerm: '',
        category: 'all',
        warehouseId: defaultWarehouseId || 'all',
        itemType: 'all',
    });

    useEffect(() => {
        setFilters(prev => ({ ...prev, warehouseId: defaultWarehouseId || 'all' }));
    }, [defaultWarehouseId]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleToggleExpand = (key: string) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(key)) {
                newSet.delete(key);
            } else {
                newSet.add(key);
            }
            return newSet;
        });
    };
    
    const handleRowClick = (product: Product, warehouse: Warehouse) => {
        setTurnoverModalData({ product, warehouse });
    };

    const allCategories = useMemo(() => {
        const productCats = new Set(dataManager.products.map(p => p.category));
        const dishCats = new Set(dataManager.dishes.map(d => d.category));
        return ['all', ...Array.from(new Set([...productCats, ...dishCats]))];
    }, [dataManager.products, dataManager.dishes]);

    useEffect(() => {
        setIsLoading(true);
        setTimeout(() => {
            const dateForLowStock = formatDate(new Date());
            const balanceStock = dataManager.getStockAsOf(filters.asOfDate);
            const lowStockStock = filters.asOfDate === dateForLowStock ? balanceStock : dataManager.getStockAsOf(dateForLowStock);

            setBalanceData(balanceStock);
            
            const filteredStockForLowStock = lowStockStock.filter(s =>
                (filters.warehouseId === 'all' || s.warehouseId === filters.warehouseId) && s.productId
            );

            const stockByProduct = new Map<string, number>();
            filteredStockForLowStock.forEach(s => {
                stockByProduct.set(s.productId!, (stockByProduct.get(s.productId!) || 0) + s.quantity);
            });
            
            const lowStockProducts = dataManager.products
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
            
            setLowStockReportData(lowStockProducts);

            setIsLoading(false);
        }, 50);
    }, [filters.asOfDate, filters.warehouseId, dataManager]);

    const balanceGroupedData = useMemo(() => {
        if (!balanceData) return [];
        
        const grouped = new Map<string, GroupedStockData>();
        
        balanceData.forEach(stockItem => {
            if (filters.warehouseId !== 'all' && stockItem.warehouseId !== filters.warehouseId) return;
            
            const warehouse = dataManager.warehouses.find(w => w.id === stockItem.warehouseId);
            if (!warehouse) return;

            let itemInfo: StockableItem | null = null;
            if (stockItem.productId) {
                const product = dataManager.products.find(p => p.id === stockItem.productId);
                if (product) itemInfo = { ...product, type: 'product' };
            } else if (stockItem.dishId) {
                const dish = dataManager.dishes.find(d => d.id === stockItem.dishId);
                const recipe = dataManager.recipes.find(r => r.dishId === stockItem.dishId);
                if (dish && recipe) itemInfo = { id: dish.id, name: dish.name, category: dish.category, unit: recipe.unit, type: 'dish' };
            }

            if (!itemInfo) return;

            if (filters.itemType !== 'all' && itemInfo.type !== filters.itemType) return;
            if (filters.category !== 'all' && itemInfo.category !== filters.category) return;
            if (!itemInfo.name.toLowerCase().includes(filters.searchTerm.toLowerCase())) return;

            const key = `${itemInfo.type}-${itemInfo.id}_${warehouse.id}`;
            const existing = grouped.get(key);

            if (existing) {
                existing.totalQty += stockItem.quantity;
                existing.totalValue += stockItem.quantity * stockItem.cost;
                existing.batches.push(stockItem);
            } else {
                grouped.set(key, {
                    item: itemInfo,
                    warehouse,
                    totalQty: stockItem.quantity,
                    totalValue: stockItem.quantity * stockItem.cost,
                    batches: [stockItem]
                });
            }
        });
        
        return Array.from(grouped.values()).sort((a,b) => a.item.name.localeCompare(b.item.name));

    }, [balanceData, filters, dataManager.products, dataManager.dishes, dataManager.recipes, dataManager.warehouses]);

    const totalAssets = useMemo(() => {
        if (!balanceGroupedData) return 0;
        return balanceGroupedData.reduce((sum, item) => sum + item.totalValue, 0);
    }, [balanceGroupedData]);
    
    const handleQuickReceipt = (product: Product) => {
        navigate('documents', { type: 'quick-receipt', product });
    };
    
    const lowStockTitle = useMemo(() => {
        const warehouseName = dataManager.warehouses.find(w => w.id === filters.warehouseId)?.name;
        const dateText = new Date().toLocaleDateString('uz-UZ');
        const warehouseText = warehouseName ? ` (${warehouseName})` : '';
        return `Minimal Zaxiradan Kam Mahsulotlar${warehouseText} (${dateText})`;
    }, [filters.warehouseId, dataManager.warehouses]);


    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                    <h2 className="text-2xl font-bold text-slate-800">Balans Hisoboti {appMode === 'pro' && '(Partiyalar bo\'yicha)'}</h2>
                    <div className="flex flex-wrap items-center gap-4">
                         <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <input
                                type="text"
                                name="searchTerm"
                                placeholder="Xomashyo/Tayyor mahsulot qidirish..."
                                value={filters.searchTerm}
                                onChange={handleFilterChange}
                                className="w-full md:w-48 pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition text-sm"
                            />
                        </div>
                         <select 
                            name="itemType"
                            value={filters.itemType} 
                            onChange={handleFilterChange}
                            className="w-full md:w-auto px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition text-sm"
                        >
                            <option value="all">Barcha Turlar</option>
                            <option value="product">Xomashyo</option>
                            <option value="dish">Tayyor mahsulot</option>
                        </select>
                         <select 
                            name="category"
                            value={filters.category} 
                            onChange={handleFilterChange}
                            className="w-full md:w-48 px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition text-sm"
                        >
                            {allCategories.map(cat => <option key={cat} value={cat}>{cat === 'all' ? 'Barcha kategoriyalar' : cat}</option>)}
                        </select>
                         <select
                            name="warehouseId"
                            value={filters.warehouseId}
                            onChange={handleFilterChange}
                            className="w-full md:w-48 px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition text-sm"
                        >
                            <option value="all">Barcha omborlar</option>
                            {dataManager.warehouses.filter(w=>w.is_active).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                         <input
                            type="date"
                            name="asOfDate"
                            value={filters.asOfDate}
                            onChange={handleFilterChange}
                            className="px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500 text-sm"
                        />
                    </div>
                </div>

                {isLoading && <div className="text-center py-8">Yuklanmoqda...</div>}

                {!isLoading && (
                    <div className="space-y-4">
                        <div className="overflow-x-auto border rounded-lg">
                            <table className="w-full text-sm border-collapse">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50 tracking-wider">
                                    <tr>
                                        <th className="px-6 py-3 text-left font-medium border-r border-slate-200">Nomi / Ombor</th>
                                        <th className="px-6 py-3 text-left font-medium border-r border-slate-200">Turi</th>
                                        <th className="px-6 py-3 text-left font-medium border-r border-slate-200">Kategoriya</th>
                                        <th className="px-6 py-3 text-right font-medium border-r border-slate-200">Jami Miqdor</th>
                                        <th className="px-6 py-3 text-right font-medium border-r border-slate-200">Tannarx</th>
                                        <th className="px-6 py-3 text-right font-medium border-r border-slate-200">Jami Summa</th>
                                        <th className="px-6 py-3 text-center font-medium"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {balanceGroupedData.length > 0 ? balanceGroupedData.map((data) => {
                                        const { item, warehouse, totalQty, totalValue, batches } = data;
                                        const key = `${item.type}-${item.id}-${warehouse.id}`;
                                        const avgCost = totalQty > 0 ? totalValue / totalQty : 0;
                                        const lastBatch = batches.length > 0 ? batches.reduce((latest, current) => new Date(current.receiptDate) > new Date(latest.receiptDate) ? current : latest) : null;
                                        const lastCost = lastBatch ? lastBatch.cost : 0;
                                        const isExpanded = expandedRows.has(key);
                                        
                                        let costIndicator = null;
                                        if (lastCost > 0 && avgCost > 0) {
                                            if (lastCost > avgCost * 1.001) costIndicator = <span className="text-red-500 font-bold" title="Oxirgi narx ko'tarilgan">▲</span>;
                                            else if (lastCost < avgCost * 0.999) costIndicator = <span className="text-green-500 font-bold" title="Oxirgi narx tushgan">▼</span>;
                                        }

                                        return (
                                            <React.Fragment key={key}>
                                                <tr className={`border-t ${isExpanded ? 'bg-slate-100' : 'hover:bg-slate-50'}`}>
                                                    <td className="px-6 py-4 font-medium text-slate-900 border-r border-slate-200">
                                                        <div className={`flex items-center gap-2 ${appMode === 'pro' ? 'cursor-pointer' : ''}`} onClick={appMode === 'pro' ? () => handleToggleExpand(key) : undefined} title={appMode === 'pro' ? "Partiyalarni ko'rish" : undefined}>
                                                            {appMode === 'pro' && <ChevronDownIcon className={`h-4 w-4 text-slate-500 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />}
                                                            <span className="flex-grow">{item.name}<span className="ml-2 text-xs text-slate-500 font-normal">({warehouse.name})</span></span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-600 border-r border-slate-200">{item.type === 'product' ? 'Xomashyo' : 'Tayyor mahsulot'}</td>
                                                    <td className="px-6 py-4 text-slate-600 border-r border-slate-200">{item.category}</td>
                                                    <td className="px-6 py-4 text-right font-mono font-semibold text-slate-800 border-r border-slate-200">
                                                        <div className="inline-flex items-center justify-end gap-1.5">{totalQty.toFixed(2)} <span className="text-xs text-slate-500 font-normal">{item.unit}</span></div>
                                                    </td>
                                                    <td className="px-6 py-4 font-mono border-r border-slate-200" title={`O'rtacha: ${formatCurrency(avgCost)}\nOxirgi: ${formatCurrency(lastCost)}`}>
                                                        <div className="flex items-center justify-end gap-x-2">{costIndicator}<div className="text-right"><div className="font-semibold text-slate-800">{formatCurrency(avgCost)}</div><div className="text-xs text-slate-500">({formatCurrency(lastCost)})</div></div></div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-mono font-bold text-slate-800 border-r border-slate-200">{formatCurrency(totalValue)}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        {/* FIX: The 'item' is of type 'StockableItem' which is not assignable to 'Product'. Find the full product object from the data manager before passing it. */}
                                                        {item.type === 'product' && <button onClick={(e) => {
                                                            e.stopPropagation();
                                                            const productToPass = dataManager.products.find(p => p.id === item.id);
                                                            if (productToPass) {
                                                                handleQuickReceipt(productToPass);
                                                            }
                                                        }} title="Tezkor kirim" className="p-1.5 rounded-full text-amber-600 hover:bg-amber-100 transition-colors"><PlusIcon className="h-5 w-5" /></button>}
                                                    </td>
                                                </tr>
                                                {appMode === 'pro' && (
                                                    <tr>
                                                        <td colSpan={7} className="p-0 border-0">
                                                            <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}><div className="overflow-hidden"><div className="p-2 bg-slate-100"><div className="p-2 bg-white rounded-md border">
                                                                <h4 className="text-xs font-semibold mb-1 px-2 text-slate-600">Partiyalar ({item.name})</h4>
                                                                <table className="w-full text-xs"><thead className="text-slate-500"><tr className="border-b"><th className="px-2 py-1 text-left border-r">Partiya №</th><th className="px-2 py-1 text-left border-r">Kirim sanasi</th><th className="px-2 py-1 text-left border-r">Yaroqlilik mudd.</th><th className="px-2 py-1 text-right border-r">Qoldiq</th><th className="px-2 py-1 text-right">Tannarx</th></tr></thead>
                                                                <tbody className="divide-y divide-slate-200">{batches.sort((a,b) => new Date(a.receiptDate).getTime() - new Date(b.receiptDate).getTime()).map(batch => (<tr key={batch.batchId}><td className="px-2 py-1.5 font-mono text-xs border-r">{batch.batchId}</td><td className="px-2 py-1.5 border-r">{new Date(batch.receiptDate).toLocaleDateString()}</td><td className="px-2 py-1.5 border-r">{batch.validDate ? new Date(batch.validDate).toLocaleDateString() : '-'}</td><td className="px-2 py-1.5 text-right font-mono border-r">{batch.quantity.toFixed(2)}</td><td className="px-2 py-1.5 text-right font-mono">{formatCurrency(batch.cost)}</td></tr>))}</tbody></table>
                                                            </div></div></div></div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    }) : (
                                        <tr><td colSpan={7} className="text-center py-10 text-slate-500">Qoldiqlar mavjud emas.</td></tr>
                                    )}
                                </tbody>
                                 <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300">
                                    <tr>
                                        <td colSpan={5} className="px-6 py-3 text-right text-slate-800">Jami Aktivlar:</td>
                                        <td className="px-6 py-3 text-right font-mono text-lg text-slate-900 border-r">{formatCurrency(totalAssets)}</td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        <div className="bg-red-50 border border-red-200 p-6 rounded-xl shadow-md">
                            <h2 className="text-xl font-bold text-red-800 mb-4">{lowStockTitle}</h2>
                            {lowStockReportData && lowStockReportData.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="text-xs text-red-700 uppercase bg-red-100">
                                            <tr>
                                                <th className="px-4 py-2 text-left">Mahsulot</th>
                                                <th className="px-4 py-2 text-right">Minimal Zaxira</th>
                                                <th className="px-4 py-2 text-right">Haqiqiy Qoldiq</th>
                                                <th className="px-4 py-2 text-right">Farq</th>
                                                <th className="px-4 py-2 text-center">Amal</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-red-200">
                                            {lowStockReportData.map(item => (
                                                <tr key={item.product.id}>
                                                    <td className="px-4 py-2 font-medium">{item.product.name}</td>
                                                    <td className="px-4 py-2 text-right font-mono">{item.product.min_stock.toFixed(2)}</td>
                                                    <td className="px-4 py-2 text-right font-mono">{item.totalQuantity.toFixed(2)}</td>
                                                    <td className="px-4 py-2 text-right font-mono font-bold text-red-600">{item.difference.toFixed(2)}</td>
                                                    <td className="px-4 py-2 text-center">
                                                        <button onClick={() => handleQuickReceipt(item.product)} className="text-xs bg-amber-500 text-white px-2 py-1 rounded hover:bg-amber-600">
                                                            Kirim qilish
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-center text-red-700 py-4">Minimal zaxiradan kam mahsulotlar topilmadi.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {turnoverModalData && (
                <ProductTurnoverModal
                    isOpen={!!turnoverModalData}
                    onClose={() => setTurnoverModalData(null)}
                    product={turnoverModalData.product}
                    warehouse={turnoverModalData.warehouse}
                    asOfDate={filters.asOfDate}
                    dataManager={dataManager}
                />
            )}
        </div>
    );
};
