
import React, { useState, useMemo, useEffect } from 'react';
import { UseMockDataReturnType } from '../../hooks/useMockData';
import { Product, Warehouse, Stock, GoodsReceiptItem, Unit } from '../../types';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';
import { SearchIcon } from '../icons/SearchIcon';
import { PlusIcon } from '../icons/PlusIcon';
import { Modal } from '../Modal';

interface BalanceSheetReportProps {
    dataManager: UseMockDataReturnType;
    navigate: (view: 'documents', payload: any) => void;
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('uz-UZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
const formatDate = (date: Date) => date.toISOString().split('T')[0];

export const BalanceSheetReport: React.FC<BalanceSheetReportProps> = ({ dataManager, navigate }) => {
    const [reportData, setReportData] = useState<Stock[] | null>(null);
    const [asOfDate, setAsOfDate] = useState(formatDate(new Date()));
    const [isLoading, setIsLoading] = useState(false);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    
    const categories = useMemo(() => {
        return ['all', ...new Set(dataManager.products.map(p => p.category))];
    }, [dataManager.products]);

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

    const handleGenerateReport = () => {
        setIsLoading(true);
        setReportData(null);
        // Using timeout to allow UI to update to "loading" state
        setTimeout(() => { 
            const data = dataManager.getStockAsOf(asOfDate);
            setReportData(data);
            setIsLoading(false);
        }, 50);
    };
    
    useEffect(() => {
        handleGenerateReport();
    }, [asOfDate, dataManager.stock, dataManager.goodsReceipts, dataManager.writeOffs, dataManager.internalTransfers]);

    const groupedData = useMemo(() => {
        if (!reportData) return [];
        const grouped = new Map<string, {product: Product, warehouse: Warehouse, items: Stock[]}>();
        
        reportData.forEach(stockItem => {
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
            .filter(({ product }) => selectedCategory === 'all' || product.category === selectedCategory)
            .filter(({ product }) => product.name.toLowerCase().includes(searchTerm.toLowerCase()));

        return filtered.sort((a,b) => a.product.name.localeCompare(b.product.name));

    }, [reportData, dataManager.products, dataManager.warehouses, selectedCategory, searchTerm]);

    const totalAssets = useMemo(() => {
        if (!groupedData) return 0;
        let total = 0;
        groupedData.forEach(({ items }) => {
             total += items.reduce((sum, i) => sum + i.quantity * i.cost, 0);
        });
        return total;
    }, [groupedData]);
    
    const handleQuickReceipt = (product: Product) => {
        navigate('documents', { type: 'quick-receipt', product });
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                <h2 className="text-2xl font-bold text-slate-800">Balans Hisoboti</h2>
                <div className="flex items-center gap-4 w-full md:w-auto">
                     <div className="relative w-full md:w-56">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Mahsulot qidirish..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm"
                        />
                    </div>
                     <select 
                        value={selectedCategory} 
                        onChange={e => setSelectedCategory(e.target.value)}
                        className="w-full md:w-48 px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm"
                    >
                        {categories.map(cat => <option key={cat} value={cat}>{cat === 'all' ? 'Barcha kategoriyalar' : cat}</option>)}
                    </select>
                     <input
                        type="date"
                        id="asOfDate"
                        value={asOfDate}
                        onChange={e => setAsOfDate(e.target.value)}
                        className="px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 text-sm"
                    />
                </div>
            </div>

            {isLoading && <div className="text-center py-8">Yuklanmoqda...</div>}

            {!isLoading && reportData && (
                <div className="space-y-4">
                    <div className="overflow-x-auto border rounded-lg">
                        <table className="w-full text-sm">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 tracking-wider">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium w-[5%]"></th>
                                    <th className="px-4 py-3 text-left font-medium">Mahsulot / Ombor</th>
                                    <th className="px-4 py-3 text-left font-medium">Kategoriya</th>
                                    <th className="px-4 py-3 text-right font-medium">Miqdor</th>
                                    <th className="px-4 py-3 text-right font-medium">Tannarx (O'rtacha)</th>
                                    <th className="px-4 py-3 text-right font-medium">Jami Summa</th>
                                    <th className="px-4 py-3 text-center font-medium"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {groupedData.length > 0 ? groupedData.map(({ product, warehouse, items }) => {
                                    const key = `${product.id}-${warehouse.id}`;
                                    const isExpanded = expandedRows.has(key);
                                    const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);
                                    const totalValue = items.reduce((sum, i) => sum + i.quantity * i.cost, 0);
                                    const avgCost = totalQty > 0 ? totalValue / totalQty : 0;

                                    return (
                                        <React.Fragment key={key}>
                                            <tr onClick={() => handleToggleExpand(key)} className="cursor-pointer hover:bg-slate-50" title="Batafsil ko'rish uchun bosing">
                                                <td className="px-4 py-3 text-center">
                                                    <ChevronDownIcon className={`h-5 w-5 text-slate-400 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                                                </td>
                                                <td className="px-4 py-3 font-medium text-slate-900">
                                                    <div>
                                                        {product.name}
                                                        <span className="ml-2 text-xs text-slate-500 font-normal">({warehouse.name})</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-slate-600">{product.category}</td>
                                                <td className="px-4 py-3 text-right font-mono font-semibold text-slate-800">{totalQty.toFixed(2)} <span className="text-xs text-slate-500">{product.unit}</span></td>
                                                <td className="px-4 py-3 text-right font-mono text-slate-600">{formatCurrency(avgCost)}</td>
                                                <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">{formatCurrency(totalValue)}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <button onClick={(e) => { e.stopPropagation(); handleQuickReceipt(product); }} title="Tezkor kirim" className="p-1.5 rounded-full text-blue-600 hover:bg-blue-100 transition-colors">
                                                        <PlusIcon className="h-5 w-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan={7} className="p-0">
                                                        <div className="bg-slate-50/70 px-4 py-2">
                                                            <table className="w-full text-xs">
                                                                <thead className="text-slate-500">
                                                                    <tr>
                                                                        <th className="px-4 py-1 text-left font-medium pl-8">Partiya</th>
                                                                        <th className="px-4 py-1 text-left font-medium">Yaroqlilik Muddati</th>
                                                                        <th className="px-4 py-1 text-right font-medium">Miqdor</th>
                                                                        <th className="px-4 py-1 text-right font-medium">Tannarx</th>
                                                                        <th className="px-4 py-1 text-right font-medium">Summa</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {items.sort((a,b) => new Date(a.received_date).getTime() - new Date(b.received_date).getTime()).map(stockItem => (
                                                                        <tr key={stockItem.id}>
                                                                            <td className="px-4 py-1.5 pl-8 font-medium">{stockItem.batch_number}</td>
                                                                            <td className="px-4 py-1.5">{stockItem.expiry_date ? new Date(stockItem.expiry_date).toLocaleDateString() : 'Muddatsiz'}</td>
                                                                            <td className="px-4 py-1.5 text-right font-mono">{stockItem.quantity.toFixed(2)}</td>
                                                                            <td className="px-4 py-1.5 text-right font-mono">{formatCurrency(stockItem.cost)}</td>
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
                                    <td colSpan={5} className="px-4 py-4 text-right text-base">Jami Aktivlar:</td>
                                    <td className="px-4 py-4 text-right font-mono text-lg text-slate-900">{formatCurrency(totalAssets)}</td>
                                    <td colSpan={2}></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
