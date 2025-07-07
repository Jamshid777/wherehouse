

import React, { useState, useEffect } from 'react';
import { UseMockDataReturnType } from '../hooks/useMockData';
import { GoodsReceiptsView } from './GoodsReceiptsView';
import { WriteOffsView } from './WriteOffsView';
import { InternalTransfersView } from './InternalTransfersView';
import { InventoryCountsView } from './InventoryCountsView';
import { PaymentsView } from './PaymentsView';
import { GoodsReturnsView } from './GoodsReturnsView';
import { ReceiptIcon } from './icons/ReceiptIcon';
import { WriteOffIcon } from './icons/WriteOffIcon';
import { TransferIcon } from './icons/TransferIcon';
import { InventoryIcon } from './icons/InventoryIcon';
import { PaymentIcon } from './icons/PaymentIcon';
import { ReturnIcon } from './icons/ReturnIcon';

interface DocumentsViewProps {
  dataManager: UseMockDataReturnType;
  newDocumentPayload: { type: string, product: any } | null;
  clearPayload: () => void;
  defaultWarehouseId: string | null;
  appMode: 'pro' | 'lite';
}

type ActiveTab = 'receipts' | 'writeoffs' | 'returns' | 'transfers' | 'inventory' | 'payments';

const tabs = [
    { id: 'receipts', label: 'Kirim Hujjatlari', icon: ReceiptIcon },
    { id: 'writeoffs', label: 'Chiqim Hujjatlari', icon: WriteOffIcon },
    { id: 'returns', label: 'Qaytarish (Ta\'minotchi)', icon: ReturnIcon },
    { id: 'transfers', label: 'Ichki Ko\'chirish', icon: TransferIcon },
    { id: 'inventory', label: 'Inventarizatsiya', icon: InventoryIcon },
    { id: 'payments', label: 'To\'lovlar', icon: PaymentIcon },
];

export const DocumentsView: React.FC<DocumentsViewProps> = ({ dataManager, newDocumentPayload, clearPayload, defaultWarehouseId, appMode }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('receipts');
  
  useEffect(() => {
    if(newDocumentPayload?.type === 'quick-receipt'){
        setActiveTab('receipts');
    }
  }, [newDocumentPayload]);

  const renderContent = () => {
    const currentPayload = activeTab === 'receipts' ? newDocumentPayload : null;
    switch (activeTab) {
      case 'receipts':
        return <GoodsReceiptsView dataManager={dataManager} newDocumentPayload={currentPayload} clearPayload={clearPayload} defaultWarehouseId={defaultWarehouseId} appMode={appMode} />;
      case 'writeoffs':
        return <WriteOffsView dataManager={dataManager} defaultWarehouseId={defaultWarehouseId} />;
      case 'returns':
        return <GoodsReturnsView dataManager={dataManager} defaultWarehouseId={defaultWarehouseId} />;
      case 'transfers':
        return <InternalTransfersView dataManager={dataManager} defaultWarehouseId={defaultWarehouseId} />;
      case 'inventory':
        return <InventoryCountsView dataManager={dataManager} defaultWarehouseId={defaultWarehouseId} />;
      case 'payments':
        return <PaymentsView dataManager={dataManager} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex border-b border-slate-200 overflow-x-auto">
        {tabs.map(tab => {
            const Icon = tab.icon;
            return (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as ActiveTab)}
                    className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                        activeTab === tab.id
                        ? 'border-b-2 border-amber-500 text-amber-600'
                        : 'text-slate-500 hover:text-amber-600'
                    }`}
                >
                    <Icon className="h-5 w-5" />
                    {tab.label}
                </button>
            )
        })}
      </div>
      <div>
        {renderContent()}
      </div>
    </div>
  );
};