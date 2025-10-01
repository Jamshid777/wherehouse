import { useState } from 'react';
import { Stock, GoodsReceiptNote, WriteOffNote, InternalTransferNote, GoodsReturnNote, PriceAdjustmentNote, DocumentStatus } from '../../types';

export const useStockData = (
    initialStock: Stock[],
) => {
    const [stock, setStock] = useState<Stock[]>(initialStock);
    
    const consumeStockByFIFO = (
        filter: { productId?: string; dishId?: string },
        warehouseId: string,
        quantityToConsume: number,
        currentStock: Stock[]
    ): { updatedStock: Stock[], consumedCost: number, consumedBatches: { batchId: string, receiptDate: string, cost: number, quantityConsumed: number }[] } => {
        let stillToConsume = quantityToConsume;
        let totalCost = 0;
        const consumedBatches: { batchId: string, receiptDate: string, cost: number, quantityConsumed: number }[] = [];

        const productBatches = currentStock
            .filter(s => s.warehouseId === warehouseId && (filter.productId ? s.productId === filter.productId : s.dishId === filter.dishId))
            .sort((a,b) => new Date(a.receiptDate).getTime() - new Date(b.receiptDate).getTime());

        if(productBatches.reduce((sum, b) => sum + b.quantity, 0) < quantityToConsume) {
            throw new Error("Omborda yetarli mahsulot mavjud emas.");
        }
        
        for(const batch of productBatches) {
            if(stillToConsume <= 0) break;
            
            const amountFromThisBatch = Math.min(stillToConsume, batch.quantity);
            totalCost += amountFromThisBatch * batch.cost;
            batch.quantity -= amountFromThisBatch;
            stillToConsume -= amountFromThisBatch;

            consumedBatches.push({
                batchId: batch.batchId,
                receiptDate: batch.receiptDate,
                cost: batch.cost,
                quantityConsumed: amountFromThisBatch
            });
        }

        const updatedStock = currentStock.filter(s => s.quantity > 0.001);
        const consumedCost = quantityToConsume > 0 ? totalCost / quantityToConsume : 0;
        
        return { updatedStock, consumedCost, consumedBatches };
    };

    const getTotalStockQuantity = (
        filter: { productId?: string; dishId?: string },
        warehouseId: string,
        currentStock: Stock[] = stock
    ) => {
        return currentStock
            .filter(s => s.warehouseId === warehouseId && (filter.productId ? s.productId === filter.productId : s.dishId === filter.dishId))
            .reduce((sum, s) => sum + s.quantity, 0);
    };

    const getTotalStockAcrossWarehouses = (productId: string) => {
        return stock.filter(s => s.productId === productId && s.quantity > 0)
                    .reduce((sum, s) => sum + s.quantity, 0);
    };
    
    return { stock, setStock, consumeStockByFIFO, getTotalStockQuantity, getTotalStockAcrossWarehouses };
};