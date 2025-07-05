
import React, { useState, useMemo, useEffect } from 'react';
import { UseMockDataReturnType } from '../../hooks/useMockData';
import { Stock, Product, Warehouse } from '../../types';

interface CriticalStockReportProps {
    dataManager: UseMockDataReturnType;
}

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

const formatDate = (date: Date) => date.toISOString().split('T')[0];

export const CriticalStockReport: React.FC<CriticalStockReportProps> = ({ dataManager }) => {
    const { products, warehouses, getStockAsOf, stock } = dataManager;
    const [reportData, setReportData] = useState<{ expiring: ExpiringProduct[], lowStock: LowStockProduct[] } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const asOfDate = useMemo(() => formatDate(new Date()), []);

    useEffect(() => {
        setIsLoading(true);
        const currentStock = getStockAsOf(asOfDate);
        
        // Expiring products
        const targetDate = new Date();
        targetDate.setHours(0, 0, 0, 0);

        const expiring = currentStock
            .filter(s => s.expiry_date && s.quantity > 0)
            .map(s => {
                const expiryDate = new Date(s.expiry_date!);
                const diffTime = expiryDate.getTime() - targetDate.getTime();
                const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const product = products.find(p => p.id === s.productId);
                const warehouse = warehouses.find(w => w.id === s.warehouseId);

                return { ...s, daysRemaining, product, warehouse };
            })
            .filter((s): s is ExpiringProduct => s.daysRemaining <= 30 && !!s.product && !!s.warehouse)
            .sort((a, b) => a.daysRemaining - b.daysRemaining);

        // Low stock products
        const stockByProduct = new Map<string, number>();
        currentStock.forEach(s => {
            stockByProduct.set(s.productId, (stockByProduct.get(s.productId) || 0) + s.quantity);
        });

        const lowStock = products
            .map(product => {
                const totalQuantity = stockByProduct.get(product.id) || 0;
                return {
                    product,
                    totalQuantity,
                    difference: totalQuantity - product.min_stock,
                };
            })
            .filter(item => item.difference < 0)
            .sort((a, b) => a.difference - b.difference); // Show most critical first
            
        setReportData({ expiring, lowStock });
        setIsLoading(false);
    }, [dataManager.stock, dataManager.goodsReceipts, dataManager.writeOffs, dataManager.internalTransfers]); // Depend on source data changes
    
    const getDaysRemainingClass = (days: number) => {
        if (days < 0) return 'bg-gray-500 text-white';
        if (days <= 7) return 'bg-red-100 text-red-800';
        if (days <= 15) return 'bg-yellow-100 text-yellow-800';
        return 'bg-blue-100 text-blue-800';
    };

     const getDaysRemainingText = (days: number) => {
        if (days < 0) return `Muddati o'tgan`;
        if (days === 0) return `Bugun`;
        return `${days} kun`;
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Kritik Qoldiqlar Hisoboti ({new Date(asOfDate).toLocaleDateString('uz-UZ')})</h2>
            
            {isLoading && <div className="text-center py-10">Yuklanmoqda...</div>}

            {!isLoading && reportData && (
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Expiring Products Section */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-slate-700 border-b pb-2">Muddati Yaqinlashayotgan Mahsulotlar</h3>
                        <div className="overflow-x-auto border rounded-lg max-h-[60vh]">
                            {reportData.expiring.length > 0 ? (
                                <table className="w-full text-sm">
                                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 tracking-wider sticky top-0">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-medium">Mahsulot / Partiya</th>
                                            <th className="px-4 py-3 text-left font-medium">Ombor</th>
                                            <th className="px-4 py-3 text-right font-medium">Miqdor</th>
                                            <th className="px-4 py-3 text-center font-medium">Qolgan kun</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {reportData.expiring.map(item => (
                                            <tr key={item.id} className="hover:bg-slate-50">
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-slate-900">{item.product.name}</div>
                                                    <div className="text-xs text-slate-500">Partiya: {item.batch_number}</div>
                                                </td>
                                                <td className="px-4 py-3 text-slate-600">{item.warehouse.name}</td>
                                                <td className="px-4 py-3 text-right font-mono text-slate-600">{item.quantity.toFixed(2)} {item.product.unit}</td>
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
                            {reportData.lowStock.length > 0 ? (
                                <table className="w-full text-sm">
                                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 tracking-wider sticky top-0">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-medium">Mahsulot</th>
                                            <th className="px-4 py-3 text-right font-medium">Min. Zaxira</th>
                                            <th className="px-4 py-3 text-right font-medium">Haqiqiy Qoldiq</th>
                                            <th className="px-4 py-3 text-right font-medium">Farq</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {reportData.lowStock.map(item => (
                                            <tr key={item.product.id} className="hover:bg-slate-50">
                                                <td className="px-4 py-3 font-medium text-slate-900">{item.product.name}</td>
                                                <td className="px-4 py-3 text-right font-mono text-slate-600">{item.product.min_stock.toFixed(2)} {item.product.unit}</td>
                                                <td className="px-4 py-3 text-right font-mono text-slate-600">{item.totalQuantity.toFixed(2)} {item.product.unit}</td>
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
    );
};
