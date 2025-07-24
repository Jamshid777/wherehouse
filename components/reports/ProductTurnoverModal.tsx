import React, { useMemo } from 'react';
import { Product, Warehouse, DocumentStatus, Unit } from '../../types';
import { UseMockDataReturnType } from '../../hooks/useMockData';
import { Modal } from '../Modal';

interface ProductTurnoverModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product | null;
    warehouse: Warehouse | null;
    asOfDate: string;
    dataManager: UseMockDataReturnType;
}

const formatQty = (qty: number, unit: Unit) => `${qty.toFixed(2)} ${unit}`;

export const ProductTurnoverModal: React.FC<ProductTurnoverModalProps> = ({
    isOpen,
    onClose,
    product,
    warehouse,
    asOfDate,
    dataManager
}) => {
    const turnoverDetails = useMemo(() => {
        if (!isOpen || !product || !warehouse) return null;

        const { getStockAsOf, goodsReceipts, writeOffs, internalTransfers, goodsReturns } = dataManager;
        
        const targetDate = new Date(asOfDate);
        const yesterday = new Date(targetDate);
        yesterday.setDate(targetDate.getDate() - 1);
        
        const openingStockList = getStockAsOf(yesterday.toISOString());
        const openingQty = openingStockList
            .filter(s => s.productId === product.id && s.warehouseId === warehouse.id)
            .reduce((sum, s) => sum + s.quantity, 0);
            
        const transactions: { type: string, docNumber: string, qty: number }[] = [];
        
        // Receipts
        goodsReceipts
            .filter(d => d.status === DocumentStatus.CONFIRMED && d.warehouse_id === warehouse.id && new Date(d.date).toDateString() === targetDate.toDateString())
            .forEach(d => {
                d.items.forEach(item => {
                    if (item.productId === product.id) {
                        transactions.push({ type: 'Kirim', docNumber: d.doc_number, qty: item.quantity });
                    }
                });
            });

        // Write-offs
        writeOffs
            .filter(d => d.status === DocumentStatus.CONFIRMED && d.warehouse_id === warehouse.id && new Date(d.date).toDateString() === targetDate.toDateString())
            .forEach(d => {
                d.items.forEach(item => {
                    if (item.productId === product.id) {
                        transactions.push({ type: 'Chiqim', docNumber: d.doc_number, qty: -item.quantity });
                    }
                });
            });

        // Returns
        goodsReturns
            .filter(d => d.status === DocumentStatus.CONFIRMED && d.warehouse_id === warehouse.id && new Date(d.date).toDateString() === targetDate.toDateString())
            .forEach(d => {
                d.items.forEach(item => {
                    if (item.productId === product.id) {
                        transactions.push({ type: "Qaytarish", docNumber: d.doc_number, qty: -item.quantity });
                    }
                });
            });

        // Transfers
        internalTransfers
             .filter(d => d.status === DocumentStatus.CONFIRMED && new Date(d.date).toDateString() === targetDate.toDateString())
             .forEach(d => {
                 d.items.forEach(item => {
                     if (item.productId === product.id) {
                         if (d.to_warehouse_id === warehouse.id) {
                             transactions.push({ type: "Ichki kirim", docNumber: d.doc_number, qty: item.quantity });
                         }
                         if (d.from_warehouse_id === warehouse.id) {
                              transactions.push({ type: "Ichki chiqim", docNumber: d.doc_number, qty: -item.quantity });
                         }
                     }
                 });
             });
        
        const totalChange = transactions.reduce((sum, t) => sum + t.qty, 0);
        const closingQty = openingQty + totalChange;
        
        return { openingQty, transactions, closingQty };
    }, [isOpen, product, warehouse, asOfDate, dataManager]);

    if (!isOpen || !product || !warehouse || !turnoverDetails) return null;
    
    const title = `${product.name} - ${new Date(asOfDate).toLocaleDateString()} holatiga harakat`;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="2xl">
            <div className="space-y-4">
                <div className="text-sm font-medium text-slate-700">
                    Ombor: <span className="font-semibold text-slate-900">{warehouse.name}</span>
                </div>
                <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-sm border-collapse">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-slate-600 border-r">Hujjat turi</th>
                                <th className="px-4 py-3 text-left font-medium text-slate-600 border-r">Hujjat raqami</th>
                                <th className="px-4 py-3 text-right font-medium text-slate-600">Miqdor</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b bg-slate-100 font-semibold">
                                <td colSpan={2} className="px-4 py-3 border-r">Kun boshiga qoldiq</td>
                                <td className="px-4 py-3 text-right font-mono">{formatQty(turnoverDetails.openingQty, product.unit)}</td>
                            </tr>
                            {turnoverDetails.transactions.length > 0 ? (
                                turnoverDetails.transactions.map((tx, index) => (
                                    <tr key={index} className="border-b last:border-0 hover:bg-slate-50">
                                        <td className="px-4 py-3 border-r">{tx.type}</td>
                                        <td className="px-4 py-3 border-r">{tx.docNumber}</td>
                                        <td className={`px-4 py-3 text-right font-mono ${tx.qty > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {tx.qty > 0 ? `+${formatQty(tx.qty, product.unit)}` : formatQty(tx.qty, product.unit)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr className="border-b">
                                    <td colSpan={3} className="px-4 py-6 text-center text-slate-500">
                                        Kun davomida harakat bo'lmagan.
                                    </td>
                                </tr>
                            )}
                            <tr className="border-t bg-slate-100 font-semibold">
                                <td colSpan={2} className="px-4 py-3 border-r">Kun oxiriga qoldiq</td>
                                <td className="px-4 py-3 text-right font-mono">{formatQty(turnoverDetails.closingQty, product.unit)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                 <div className="flex justify-end pt-4">
                    <button onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300">
                        Yopish
                    </button>
                </div>
            </div>
        </Modal>
    );
};