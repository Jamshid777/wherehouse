import React, { useState } from 'react';
import { UseMockDataReturnType } from '../hooks/useMockData';
import { ProductsView } from './ProductsView';
import { StockOverviewReport } from './reports/StockOverviewReport';
import { TurnoverStatementReport } from './reports/TurnoverStatementReport';
import { ProductIcon } from './icons/ProductIcon';
import { BalanceIcon } from './icons/BalanceIcon';
import { ProductionIcon } from './icons/ProductionIcon';
import { TransferIcon } from './icons/TransferIcon';
import { DishesView } from './DishesView';
import { ReportIcon } from './icons/ReportIcon';
import { ProductionNotesView } from './ProductionNotesView';

interface ProductsHubViewProps {
  dataManager: UseMockDataReturnType;
  navigate: (view: any, payload: any) => void;
  defaultWarehouseId: string | null;
  appMode: 'pro' | 'lite';
}

type ActiveTab = 'list' | 'stock_overview' | 'production' | 'production_documents' | 'turnover';

const tabs = [
    { id: 'stock_overview', label: 'Qoldiqlar', icon: BalanceIcon },
    { id: 'production', label: 'Tayyor mahsulotlar va Retseptlar', icon: ProductionIcon },
    { id: 'production_documents', label: 'Ishlab Chiqarish Hujjatlari', icon: ReportIcon },
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
        return <DishesView dataManager={dataManager} defaultWarehouseId={defaultWarehouseId} />;
      case 'production_documents':
        return <ProductionNotesView dataManager={dataManager} />;
      case 'turnover':
        return <TurnoverStatementReport dataManager={dataManager} defaultWarehouseId={defaultWarehouseId} appMode={appMode} />;
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