
import React, { useState } from 'react';
import { UseMockDataReturnType } from '../hooks/useMockData';
import { WarehousesView } from './WarehousesView';
import { SuppliersView } from './SuppliersView';
import { WarehouseIcon } from './icons/WarehouseIcon';
import { SupplierIcon } from './icons/SupplierIcon';

interface ManagementTabsProps {
  dataManager: UseMockDataReturnType;
}

type ActiveTab = 'warehouses' | 'suppliers';

export const ManagementTabs: React.FC<ManagementTabsProps> = ({ dataManager }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('warehouses');

  return (
    <div className="space-y-6">
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('warehouses')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'warehouses'
              ? 'border-b-2 border-amber-500 text-amber-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <WarehouseIcon className="h-5 w-5" />
          Omborlar
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'suppliers'
              ? 'border-b-2 border-amber-500 text-amber-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <SupplierIcon className="h-5 w-5" />
          Yetkazib beruvchilar
        </button>
      </div>
      <div>
        {activeTab === 'warehouses' ? <WarehousesView dataManager={dataManager} /> : <SuppliersView dataManager={dataManager} />}
      </div>
    </div>
  );
};
