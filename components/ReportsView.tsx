import React, { useState } from 'react';
import { UseMockDataReturnType } from '../hooks/useMockData';
import { TurnoverStatementReport } from './reports/TurnoverStatementReport';
import { GoodsReceiptsReport } from './reports/GoodsReceiptsReport';
import { SupplierBalanceReport } from './reports/SupplierBalanceReport';
import { AgingReport } from './reports/AgingReport';
import { StockOverviewReport } from './reports/CriticalStockReport';
import { BalanceIcon } from './icons/BalanceIcon';
import { TransferIcon } from './icons/TransferIcon';
import { ReceiptIcon } from './icons/ReceiptIcon';
import { SupplierIcon } from './icons/SupplierIcon';
import { ClockIcon } from './icons/ClockIcon';

interface ReportsViewProps {
  dataManager: UseMockDataReturnType;
  navigate: (view: 'documents', payload: any) => void;
}

type ActiveTab = 'critical_stock' | 'turnover' | 'receipts' | 'supplier_balance' | 'aging';

const tabs = [
    { id: 'critical_stock', label: 'Qoldiqlar', icon: BalanceIcon },
    { id: 'turnover', label: 'Aylanma Qaydnoma', icon: TransferIcon },
    { id: 'receipts', label: 'Kirimlar Hisoboti', icon: ReceiptIcon },
    { id: 'supplier_balance', label: 'Yetkazib beruvchilar balansi', icon: SupplierIcon },
    { id: 'aging', label: 'Qarzdorlik Muddati', icon: ClockIcon },
];

export const ReportsView: React.FC<ReportsViewProps> = ({ dataManager, navigate }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('critical_stock');

  const renderContent = () => {
    switch (activeTab) {
      case 'critical_stock':
        return <StockOverviewReport dataManager={dataManager} navigate={navigate} />;
      case 'turnover':
        return <TurnoverStatementReport dataManager={dataManager} />;
      case 'receipts':
        return <GoodsReceiptsReport dataManager={dataManager} />;
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