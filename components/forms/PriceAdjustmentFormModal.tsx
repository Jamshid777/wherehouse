import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../Modal';
import { ConfirmationModal } from '../ConfirmationModal';
import { GoodsReceiptNote, GoodsReceiptItem, PriceAdjustmentNote, DocumentStatus, Product } from '../../types';
import { UseMockDataReturnType } from '../../hooks/useMockData';

const formatCurrency = (amount: number) => new Intl.NumberFormat('uz-UZ').format(amount);

interface PriceAdjustmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveDraft: (data: Omit<PriceAdjustmentNote, 'id' | 'status' | 'doc_number'>) => void;
  onConfirm: (data: Omit<PriceAdjustmentNote, 'id' | 'status' | 'doc_number'>) => void;
  dataManager: UseMockDataReturnType;
  adjustmentData: { note: GoodsReceiptNote, item: GoodsReceiptItem, itemIndex: number } | null;
}

export const PriceAdjustmentFormModal: React.FC<PriceAdjustmentFormModalProps> = ({ isOpen, onClose, onSaveDraft, onConfirm, dataManager, adjustmentData }) => {
    const [formData, setFormData] = useState({ newPrice: 0, reason: '' });
    const [showConfirm, setShowConfirm] = useState(false);
    
    const product = useMemo(() => {
        if (!adjustmentData) return null;
        return dataManager.products.find(p => p.id === adjustmentData.item.productId);
    }, [adjustmentData, dataManager.products]);

    useEffect(() => {
        if (adjustmentData) {
            setFormData({ newPrice: adjustmentData.item.price, reason: '' });
        }
    }, [adjustmentData]);

    const balanceImpact = useMemo(() => {
        if (!adjustmentData) return 0;
        const { item } = adjustmentData;
        return (formData.newPrice - item.price) * item.quantity;
    }, [formData.newPrice, adjustmentData]);

    const handleFormSubmit = (e: React.FormEvent, action: 'save' | 'confirm') => {
        e.preventDefault();
        if (!adjustmentData) return;
        if (formData.newPrice < 0) {
            alert("Yangi narx manfiy bo'lishi mumkin emas.");
            return;
        }

        if (action === 'confirm') {
            setShowConfirm(true);
        } else {
            executeSubmit(onSaveDraft);
        }
    };

    const executeSubmit = (submitFn: (data: any) => void) => {
        if (!adjustmentData) return;
        const { note, item } = adjustmentData;
        const adjustmentNoteData = {
            date: new Date().toISOString(),
            goodsReceiptNoteId: note.id,
            supplier_id: note.supplier_id,
            warehouse_id: note.warehouse_id,
            items: [{
                productId: item.productId,
                batchId: item.batchId,
                originalQuantity: item.quantity,
                oldPrice: item.price,
                newPrice: formData.newPrice,
                reason: formData.reason,
            }]
        };
        submitFn(adjustmentNoteData);
        onClose();
    };

    if (!isOpen || !adjustmentData || !product) return null;

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title="Narxni Korrektirovka Qilish" size="2xl" closeOnOverlayClick={false}>
                <form onSubmit={(e) => handleFormSubmit(e, 'save')} className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-lg space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Mahsulot:</span>
                            <span className="font-bold text-slate-800">{product.name}</span>
                        </div>
                         <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Partiya №:</span>
                            <span className="font-mono text-slate-800">{adjustmentData.item.batchId}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Eski narx:</span>
                            <span className="font-mono text-slate-800">{formatCurrency(adjustmentData.item.price)}</span>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="newPrice" className="block text-sm font-medium text-slate-700 mb-1">Yangi Narx</label>
                        <input
                            type="number"
                            id="newPrice"
                            value={formData.newPrice}
                            onChange={(e) => setFormData(prev => ({ ...prev, newPrice: parseFloat(e.target.value) || 0 }))}
                            min="0"
                            step="any"
                            required
                            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="reason" className="block text-sm font-medium text-slate-700 mb-1">Sabab</label>
                        <input
                            type="text"
                            id="reason"
                            value={formData.reason}
                            onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                            required
                            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500"
                        />
                    </div>
                     <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200">
                            Bekor qilish
                        </button>
                        <button type="submit" className="px-4 py-2 bg-gradient-to-r from-sky-500 to-sky-600 text-white rounded-lg hover:from-sky-600 hover:to-sky-700">
                            Korrektirovka Yaratish
                        </button>
                         <button
                            type="button"
                            onClick={(e) => handleFormSubmit(e, 'confirm')}
                            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700"
                        >
                            Yaratish va Tasdiqlash
                        </button>
                    </div>
                </form>
            </Modal>
            <ConfirmationModal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={() => executeSubmit(onConfirm)}
                title="Korrektirovkani tasdiqlash"
                message={<>Diqqat! Ushbu amal ta'minotchi bilan bo'lgan balansni <b className={balanceImpact > 0 ? 'text-red-600' : 'text-green-600'}>{formatCurrency(balanceImpact)}</b> so'mga va ombordagi ushbu partiya qoldig'ining tannarxini o'zgartiradi. Davom etasizmi?</>}
                confirmButtonText="Ha, tasdiqlash"
            />
        </>
    );
};
