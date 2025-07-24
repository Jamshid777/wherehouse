
import React, { useState } from 'react';
import { UseMockDataReturnType } from '../hooks/useMockData';
import { WarehousesView } from './WarehousesView';
import { WriteOffsView } from './WriteOffsView';
import { InternalTransfersView } from './InternalTransfersView';
import { InventoryCountsView } from './InventoryCountsView';
import { WarehouseIcon } from './icons/WarehouseIcon';
import { WriteOffIcon } from './icons/WriteOffIcon';
import { TransferIcon } from './icons/TransferIcon';
import { InventoryIcon } from './icons/InventoryIcon';

interface WarehousesHubViewProps {
  dataManager: UseMockDataReturnType;
  defaultWarehouseId: string | null;
}

type ActiveTab = 'list' | 'writeoffs' | 'transfers' | 'inventory';

const tabs = [
    { id: 'list', label: 'Omborlar Ro\'yxati', icon: WarehouseIcon },
    { id: 'writeoffs', label: 'Chiqim Hujjatlari', icon: WriteOffIcon },
    { id: 'transfers', label: 'Ichki Ko\'chirish', icon: TransferIcon },
    { id: 'inventory', label: 'Inventarizatsiya', icon: InventoryIcon },
];

export const WarehousesHubView: React.FC<WarehousesHubViewProps> = ({ dataManager, defaultWarehouseId }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('list');

  const renderContent = () => {
    switch (activeTab) {
      case 'list':
        return <WarehousesView dataManager={dataManager} />;
      case 'writeoffs':
        return <WriteOffsView dataManager={dataManager} defaultWarehouseId={defaultWarehouseId} />;
      case 'transfers':
        return <InternalTransfersView dataManager={dataManager} defaultWarehouseId={defaultWarehouseId} />;
      case 'inventory':
        return <InventoryCountsView dataManager={dataManager} defaultWarehouseId={defaultWarehouseId} />;
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
