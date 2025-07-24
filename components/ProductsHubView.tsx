
import React, { useState } from 'react';
import { UseMockDataReturnType } from '../hooks/useMockData';
import { ProductsView } from './ProductsView';
import { StockOverviewReport } from './reports/StockOverviewReport';
import { ProductionReport } from './reports/ProductionReport';
import { TurnoverStatementReport } from './reports/TurnoverStatementReport';
import { ProductIcon } from './icons/ProductIcon';
import { BalanceIcon } from './icons/BalanceIcon';
import { ProductionIcon } from './icons/ProductionIcon';
import { TransferIcon } from './icons/TransferIcon';

interface ProductsHubViewProps {
  dataManager: UseMockDataReturnType;
  navigate: (view: any, payload: any) => void;
  defaultWarehouseId: string | null;
  appMode: 'pro' | 'lite';
}

type ActiveTab = 'list' | 'stock_overview' | 'production' | 'turnover';

const tabs = [
    { id: 'stock_overview', label: 'Qoldiqlar', icon: BalanceIcon },
    { id: 'production', label: 'Taomlar', icon: ProductionIcon },
    { id: 'turnover', label: 'Aylanma Qaydnoma', icon: TransferIcon },
    { id: 'list', label: 'Mahsulotlar Ro\'yxati', icon: ProductIcon },
];

export const ProductsHubView: React.FC<ProductsHubViewProps> = ({ dataManager, navigate, defaultWarehouseId, appMode }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('stock_overview');

  const renderContent = () => {
    switch (activeTab) {
      case 'list':
        return <ProductsView dataManager={dataManager} />;
      case 'stock_overview':
        return <StockOverviewReport dataManager={dataManager} navigate={navigate} defaultWarehouseId={defaultWarehouseId} appMode={appMode} />;
      case 'production':
        return <ProductionReport dataManager={dataManager} />;
      case 'turnover':
        return <TurnoverStatementReport dataManager={dataManager} defaultWarehouseId={defaultWarehouseId} appMode={appMode} />;
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
