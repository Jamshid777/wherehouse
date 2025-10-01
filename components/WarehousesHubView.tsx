
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