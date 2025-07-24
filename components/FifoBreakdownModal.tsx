import React from 'react';
import { Modal } from './Modal';
import { WriteOffItem, Product } from '../types';

const formatCurrency = (amount: number) => new Intl.NumberFormat('uz-UZ').format(amount);

interface FifoBreakdownModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: WriteOffItem | null;
    product: Product | null;
    title: string;
}

export const FifoBreakdownModal: React.FC<FifoBreakdownModalProps> = ({ isOpen, onClose, item, product, title }) => {
    if (!isOpen || !item || !product) return null;

    const consumedBatches = item.consumedBatches || [];
    const totalAmount = consumedBatches.reduce((sum, batch) => sum + batch.cost * batch.quantityConsumed, 0);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="2xl">
            <div className="space-y-4">
                <div className="text-sm text-slate-600">
                    Quyida <span className="font-bold">{item.quantity} {product.unit}</span> mahsulotining hisobdan chiqarilishida qatnashgan partiyalar va ularning tannarxi ko'rsatilgan.
                </div>
                <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-sm border-collapse">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="px-4 py-2 text-left font-medium border-r">Partiya №</th>
                                <th className="px-4 py-2 text-left font-medium border-r">Kirim sanasi</th>
                                <th className="px-4 py-2 text-right font-medium border-r">Miqdori</th>
                                <th className="px-4 py-2 text-right font-medium border-r">Narxi</th>
                                <th className="px-4 py-2 text-right font-medium">Summa</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {consumedBatches.map((batch, index) => (
                                <tr key={index}>
                                    <td className="px-4 py-2 font-mono text-xs border-r">{batch.batchId}</td>
                                    <td className="px-4 py-2 border-r">{new Date(batch.receiptDate).toLocaleDateString()}</td>
                                    <td className="px-4 py-2 text-right font-mono border-r">{batch.quantityConsumed.toFixed(2)}</td>
                                    <td className="px-4 py-2 text-right font-mono border-r">{formatCurrency(batch.cost)}</td>
                                    <td className="px-4 py-2 text-right font-mono">{formatCurrency(batch.cost * batch.quantityConsumed)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-slate-100 font-bold">
                            <tr>
                                <td colSpan={2} className="px-4 py-2 text-right border-r">Jami:</td>
                                <td className="px-4 py-2 text-right font-mono border-r">{item.quantity.toFixed(2)}</td>
                                <td className="px-4 py-2 text-right font-mono border-r" title="O'rtacha narx">{formatCurrency(item.cost)}</td>
                                <td className="px-4 py-2 text-right font-mono">{formatCurrency(totalAmount)}</td>
                            </tr>
                        </tfoot>
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
