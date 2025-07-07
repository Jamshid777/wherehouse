
import React, { useState, useMemo, useEffect } from 'react';
import { UseMockDataReturnType } from '../../hooks/useMockData';
import { Product, Warehouse, Stock, Unit } from '../../types';
import { SearchIcon } from '../icons/SearchIcon';
import { PlusIcon } from '../icons/PlusIcon';

interface StockOverviewReportProps {
    dataManager: UseMockDataReturnType;
    navigate: (view: 'documents', payload: any) => void;
    defaultWarehouseId: string | null;
}

// Helpers
const formatCurrency = (amount: number) => new Intl.NumberFormat('uz-UZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
const formatDate = (date: Date) => date.toISOString().split('T')[0];

interface LowStockProduct {
    product: Product;
    totalQuantity: number;
    difference: number;
}

export const StockOverviewReport: React.FC<StockOverviewReportProps> = ({ dataManager, navigate, defaultWarehouseId }) => {
    const [balanceData, setBalanceData] = useState<Stock[] | null>(null);
    const [lowStockReportData, setLowStockReportData] = useState<LowStockProduct[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [filters, setFilters] = useState({
        asOfDate: formatDate(new Date()),
        searchTerm: '',
        category: 'all',
        warehouseId: defaultWarehouseId || 'all',
    });

    useEffect(() => {
        setFilters(prev => ({ ...prev, warehouseId: defaultWarehouseId || 'all' }));
    }, [defaultWarehouseId]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const balanceCategories = useMemo(() => {
        return ['all', ...new Set(dataManager.products.map(p => p.category))];
    }, [dataManager.products]);

    useEffect(() => {
        setIsLoading(true);
        setTimeout(() => {
            const dateForLowStock = formatDate(new Date());
            const balanceStock = dataManager.getStockAsOf(filters.asOfDate);
            const lowStockStock = filters.asOfDate === dateForLowStock ? balanceStock : dataManager.getStockAsOf(dateForLowStock);

            setBalanceData(balanceStock);
            
            const filteredStockForLowStock = lowStockStock.filter(s =>
                filters.warehouseId === 'all' || s.warehouseId === filters.warehouseId
            );

            const stockByProduct = new Map<string, number>();
            filteredStockForLowStock.forEach(s => {
                stockByProduct.set(s.productId, (stockByProduct.get(s.productId) || 0) + s.quantity);
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
        
        const grouped = new Map<string, {product: Product, warehouse: Warehouse, totalQty: number, totalValue: number}>();
        
        balanceData.forEach(stockItem => {
            if (filters.warehouseId !== 'all' && stockItem.warehouseId !== filters.warehouseId) return;
            
            const product = dataManager.products.find(p => p.id === stockItem.productId);
            const warehouse = dataManager.warehouses.find(w => w.id === stockItem.warehouseId);
            
            if (!product || !warehouse) return;
            if (filters.category !== 'all' && product.category !== filters.category) return;
            if (!product.name.toLowerCase().includes(filters.searchTerm.toLowerCase())) return;

            const key = `${product.id}_${warehouse.id}`;
            grouped.set(key, { 
                product, 
                warehouse, 
                totalQty: stockItem.quantity,
                totalValue: stockItem.quantity * stockItem.average_cost
            });
        });
        
        return Array.from(grouped.values()).sort((a,b) => a.product.name.localeCompare(b.product.name));

    }, [balanceData, filters, dataManager.products, dataManager.warehouses]);

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
                    <h2 className="text-2xl font-bold text-slate-800">Balans Hisoboti</h2>
                    <div className="flex flex-wrap items-center gap-4">
                         <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <input
                                type="text"
                                name="searchTerm"
                                placeholder="Mahsulot qidirish..."
                                value={filters.searchTerm}
                                onChange={handleFilterChange}
                                className="w-full md:w-48 pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition text-sm"
                            />
                        </div>
                         <select 
                            name="category"
                            value={filters.category} 
                            onChange={handleFilterChange}
                            className="w-full md:w-48 px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition text-sm"
                        >
                            {balanceCategories.map(cat => <option key={cat} value={cat}>{cat === 'all' ? 'Barcha kategoriyalar' : cat}</option>)}
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
                                        <th className="px-4 py-3 text-left font-medium border-r border-slate-200">Mahsulot / Ombor</th>
                                        <th className="px-4 py-3 text-left font-medium border-r border-slate-200">Kategoriya</th>
                                        <th className="px-4 py-3 text-right font-medium border-r border-slate-200">Miqdor</th>
                                        <th className="px-4 py-3 text-right font-medium border-r border-slate-200">Tannarx (O'rtacha)</th>
                                        <th className="px-4 py-3 text-right font-medium border-r border-slate-200">Jami Summa</th>
                                        <th className="px-4 py-3 text-center font-medium"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {balanceGroupedData.length > 0 ? balanceGroupedData.map(({ product, warehouse, totalQty, totalValue }) => {
                                        const key = `${product.id}-${warehouse.id}`;
                                        const avgCost = totalQty > 0 ? totalValue / totalQty : 0;
                                        return (
                                            <tr key={key} className="hover:bg-slate-50">
                                                <td className="px-4 py-3 font-medium text-slate-900 border-r border-slate-200">
                                                    <div>{product.name}<span className="ml-2 text-xs text-slate-500 font-normal">({warehouse.name})</span></div>
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
                                        );
                                    }) : (
                                        <tr><td colSpan={6} className="text-center py-10 text-slate-500">Ma'lumot topilmadi.</td></tr>
                                    )}
                                </tbody>
                                <tfoot className="bg-slate-100 font-bold">
                                    <tr>
                                        <td colSpan={4} className="px-4 py-4 text-right text-base border-r border-slate-200">Jami Aktivlar:</td>
                                        <td className="px-4 py-4 text-right font-mono text-lg text-slate-900 border-r border-slate-200">{formatCurrency(totalAssets)}</td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
                 <h2 className="text-2xl font-bold text-slate-800 mb-4">{lowStockTitle}</h2>
                 
                 {isLoading && <div className="text-center py-10">Yuklanmoqda...</div>}

                 {!isLoading && lowStockReportData && (
                     <div className="overflow-x-auto border rounded-lg max-h-[60vh]">
                         {lowStockReportData.length > 0 ? (
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
                                     {lowStockReportData.map(item => (
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
                 )}
            </div>
        </div>
    );
};
