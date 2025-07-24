

import React, { useState } from 'react';
import { UseMockDataReturnType } from '../../hooks/useMockData';
import { TurnoverStatementReport } from './reports/TurnoverStatementReport';
import { SupplierBalanceReport } from './reports/SupplierBalanceReport';
import { AgingReport } from './reports/AgingReport';
import { StockOverviewReport } from './reports/StockOverviewReport';
import { BalanceIcon } from './icons/BalanceIcon';
import { TransferIcon } from './icons/TransferIcon';
import { SupplierIcon } from './icons/SupplierIcon';
import { ClockIcon } from './icons/ClockIcon';
import { PaymentsReport } from './reports/PaymentsReport';
import { PaymentIcon } from './icons/PaymentIcon';
import { ProductionReport } from './reports/ProductionReport';
import { ProductionIcon } from './icons/ProductionIcon';

interface ReportsViewProps {
  dataManager: UseMockDataReturnType;
  navigate: (view: 'documents', payload: any) => void;
  defaultWarehouseId: string | null;
  appMode: 'pro' | 'lite';
}

type ActiveTab = 'critical_stock' | 'production' | 'payments_report' | 'turnover' | 'supplier_balance' | 'aging';

const tabs = [
    { id: 'critical_stock', label: 'Qoldiqlar', icon: BalanceIcon },
    { id: 'production', label: 'Ishlab Chiqarish', icon: ProductionIcon },
    { id: 'supplier_balance', label: 'Yetkazib beruvchilar balansi', icon: SupplierIcon },
    { id: 'payments_report', label: 'To\'lovlar Hisoboti', icon: PaymentIcon },
    { id: 'aging', label: 'Qarzdorlik Muddati', icon: ClockIcon },
    { id: 'turnover', label: 'Aylanma Qaydnoma', icon: TransferIcon },
];

export const ReportsView: React.FC<ReportsViewProps> = ({ dataManager, navigate, defaultWarehouseId, appMode }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('critical_stock');

  const renderContent = () => {
    switch (activeTab) {
      case 'critical_stock':
        return <StockOverviewReport dataManager={dataManager} navigate={navigate} defaultWarehouseId={defaultWarehouseId} appMode={appMode} />;
      case 'production':
        return <ProductionReport dataManager={dataManager} />;
      case 'payments_report':
        return <PaymentsReport dataManager={dataManager} />;
      case 'turnover':
        return <TurnoverStatementReport dataManager={dataManager} defaultWarehouseId={defaultWarehouseId} appMode={appMode} />;
      case 'supplier_balance':
        return <SupplierBalanceReport dataManager={dataManager} />;
      case 'aging':
        return <AgingReport dataManager={dataManager} />;
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