

import React, { useState, useEffect } from 'react';
import { UseMockDataReturnType } from '../hooks/useMockData';
import { GoodsReceiptsView } from './GoodsReceiptsView';
import { PaymentsView } from './PaymentsView';
import { GoodsReturnsView } from './GoodsReturnsView';
import { ReceiptIcon } from './icons/ReceiptIcon';
import { PaymentIcon } from './icons/PaymentIcon';
import { ReturnIcon } from './icons/ReturnIcon';

interface DocumentsViewProps {
  dataManager: UseMockDataReturnType;
  newDocumentPayload: { type: string, product: any } | null;
  clearPayload: () => void;
  defaultWarehouseId: string | null;
  appMode: 'pro' | 'lite';
}

type ActiveTab = 'receipts' | 'returns' | 'payments';

const tabs = [
    { id: 'receipts', label: 'Kirim Hujjatlari', icon: ReceiptIcon },
    { id: 'returns', label: 'Qaytarish (Ta\'minotchi)', icon: ReturnIcon },
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
      case 'returns':
        return <GoodsReturnsView dataManager={dataManager} defaultWarehouseId={defaultWarehouseId} />;
      case 'payments':
        return <PaymentsView dataManager={dataManager} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-100 p-1 rounded-lg flex space-x-1 overflow-x-auto">
        {tabs.map(tab => {
            const Icon = tab.icon;
            return (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as ActiveTab)}
                    className={`flex-shrink-0 w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm transition-colors whitespace-nowrap rounded-md ${
                        activeTab === tab.id
                        ? 'bg-white text-amber-600 shadow-sm font-medium'
                        : 'text-gray-600 hover:bg-white/60'
                    }`}
                >
                    <Icon className="h-5 w-5" />
                    <span>{tab.label}</span>
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