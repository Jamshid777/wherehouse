import React, { useState } from 'react';
import { UseMockDataReturnType } from '../hooks/useMockData';
import { SalesIcon } from './icons/SalesIcon';
import { UsersIcon } from './icons/UsersIcon';
import { PaymentIcon } from './icons/PaymentIcon';
import { BalanceIcon } from './icons/BalanceIcon';
import { ClientsView } from './ClientsView';
import { SalesInvoicesView } from './SalesInvoicesView';
import { ClientPaymentsView } from './ClientPaymentsView';
import { ClientBalanceReport } from './reports/ClientBalanceReport';
import { ProfitIcon } from './icons/ProfitIcon';
import { ProfitAndLossReport } from './reports/ProfitAndLossReport';
import { ExpenseIcon } from './icons/ExpenseIcon';
import { ExpensesView } from './ExpensesView';


interface SalesHubViewProps {
  dataManager: UseMockDataReturnType;
  defaultWarehouseId: string | null;
  appMode: 'pro' | 'lite';
}

type ActiveTab = 'invoices' | 'pnl' | 'expenses' | 'clients' | 'payments' | 'balance';

const tabs = [
    { id: 'invoices', label: 'Sotuv Hujjatlari', icon: SalesIcon },
    { id: 'pnl', label: 'Foyda va Zarar', icon: ProfitIcon },
    { id: 'expenses', label: 'Harajatlar', icon: ExpenseIcon },
    { id: 'clients', label: 'Mijozlar', icon: UsersIcon },
    { id: 'payments', label: 'Mijoz To\'lovlari', icon: PaymentIcon },
    { id: 'balance', label: 'Mijozlar Balansi', icon: BalanceIcon },
];

export const SalesHubView: React.FC<SalesHubViewProps> = (props) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('invoices');

  const renderContent = () => {
    switch (activeTab) {
      case 'invoices':
        return <SalesInvoicesView dataManager={props.dataManager} defaultWarehouseId={props.defaultWarehouseId} />;
      case 'pnl':
        return <ProfitAndLossReport dataManager={props.dataManager} />;
      case 'expenses':
        return <ExpensesView dataManager={props.dataManager} />;
      case 'clients':
        return <ClientsView dataManager={props.dataManager} />;
      case 'payments':
        return <ClientPaymentsView dataManager={props.dataManager} />;
      case 'balance':
        return <ClientBalanceReport dataManager={props.dataManager} />;
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