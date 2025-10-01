import { useState } from 'react';
import { Supplier, GoodsReceiptNote, Payment, GoodsReturnNote, DocumentStatus, PriceAdjustmentNote, GoodsReceiptItem } from '../../types';

interface useSupplierDataProps {
    initialSuppliers: Supplier[];
    goodsReceipts: GoodsReceiptNote[];
    payments: Payment[];
    goodsReturns: GoodsReturnNote[];
    priceAdjustments: PriceAdjustmentNote[];
    suppliers: Supplier[];
    getNoteTotal: (items: GoodsReceiptItem[]) => number;
}

export const useSupplierData = ({ initialSuppliers, goodsReceipts, payments, goodsReturns, priceAdjustments, suppliers: suppliersData, getNoteTotal }: useSupplierDataProps) => {
    const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);

    const addSupplier = (supplier: Omit<Supplier, 'id'>): Supplier => {
        const newSupplier = { ...supplier, id: `s${Date.now()}` };
        setSuppliers(prev => [newSupplier, ...prev]);
        return newSupplier;
    };
    const updateSupplier = (updatedSupplier: Supplier) => setSuppliers(prev => prev.map(s => s.id === updatedSupplier.id ? updatedSupplier : s));
    const deleteSupplier = (supplierId: string) => setSuppliers(prev => prev.filter(s => s.id !== supplierId));
    const isInnUnique = (inn: string, currentId: string | null = null) => !suppliers.some(s => s.inn === inn && s.id !== currentId);

    const canDeleteSupplier = (supplierId: string): boolean => {
        const supplier = suppliers.find(s => s.id === supplierId);
        if (!supplier) {
            return true;
        }

        const hasInitialBalance = Math.abs(supplier.initial_balance) > 0.01;
        const hasReceipts = goodsReceipts.some(gr => gr.supplier_id === supplierId);
        const hasPayments = payments.some(p => p.supplier_id === supplierId);
        const hasReturns = goodsReturns.some(gr => gr.supplier_id === supplierId);

        return !(hasInitialBalance || hasReceipts || hasPayments || hasReturns);
    };

    const getSupplierBalance = (supplierId: string) => {
        const supplier = suppliersData.find(s => s.id === supplierId);
        if (!supplier) return 0;
  
        const totalReceipts = goodsReceipts.reduce((sum, note) => {
            if (note.supplier_id === supplierId && note.status === DocumentStatus.CONFIRMED) {
                return sum + getNoteTotal(note.items);
            }
            return sum;
        }, 0);
  
        const totalPayments = payments.reduce((sum, payment) => {
            if (payment.supplier_id === supplierId) {
                return sum + payment.amount;
            }
            return sum;
        }, 0);
  
        const totalReturns = goodsReturns.reduce((sum, note) => {
          if(note.supplier_id === supplierId && note.status === DocumentStatus.CONFIRMED) {
              const returnTotal = note.items.reduce((itemSum, item) => itemSum + item.quantity * item.cost, 0);
              return sum + returnTotal;
          }
          return sum;
        }, 0);
  
        const totalAdjustments = priceAdjustments.reduce((sum, note) => {
          if (note.supplier_id === supplierId && note.status === DocumentStatus.CONFIRMED) {
              const adjustmentAmount = note.items.reduce((itemSum, item) => {
                  return itemSum + (item.newPrice - item.oldPrice) * item.originalQuantity;
              }, 0);
              return sum + adjustmentAmount;
          }
          return sum;
        }, 0);
  
        return supplier.initial_balance + totalReceipts - totalPayments - totalReturns + totalAdjustments;
    }

    return { suppliers, setSuppliers, addSupplier, updateSupplier, deleteSupplier, isInnUnique, canDeleteSupplier, getSupplierBalance };
};
