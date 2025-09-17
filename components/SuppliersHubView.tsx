import React, { useState, useEffect } from 'react';
import { UseMockDataReturnType } from '../hooks/useMockData';
import { SuppliersView } from './SuppliersView';
import { SupplierBalanceReport } from './reports/SupplierBalanceReport';
import { PaymentsReport } from './reports/PaymentsReport';
import { AgingReport } from './reports/AgingReport';
import { DocumentsView } from './DocumentsView';
import { SupplierIcon } from './icons/SupplierIcon';
import { SupplierBalanceIcon } from './icons/SupplierBalanceIcon';
import { PaymentIcon } from './icons/PaymentIcon';
import { ClockIcon } from './icons/ClockIcon';
import { DocumentIcon } from './icons/DocumentIcon';

interface SuppliersHubViewProps {
  dataManager: UseMockDataReturnType;
  newDocumentPayload: any; 
  clearPayload: () => void;
  defaultWarehouseId: string | null;
  appMode: 'pro' | 'lite';
}

type ActiveTab = 'list' | 'documents' | 'balance' | 'payments_report' | 'aging';

const tabs = [
    { id: 'list', label: "Ta'minotchilar Ro'yxati", icon: SupplierIcon },
    { id: 'documents', label: 'Hujjatlar', icon: DocumentIcon },
    { id: 'balance', label: 'Balans Hisoboti', icon: SupplierBalanceIcon },
    { id: 'payments_report', label: 'To\'lovlar Hisoboti', icon: PaymentIcon },
    { id: 'aging', label: 'Qarzdorlik Muddati', icon: ClockIcon },
];

export const SuppliersHubView: React.FC<SuppliersHubViewProps> = (props) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('list');

  useEffect(() => {
    if(props.newDocumentPayload?.targetTab === 'documents'){
        setActiveTab('documents');
    }
  }, [props.newDocumentPayload]);

  const renderContent = () => {
    switch (activeTab) {
      case 'list':
        return <SuppliersView dataManager={props.dataManager} />;
      case 'documents':
        return <DocumentsView 
                    dataManager={props.dataManager} 
                    newDocumentPayload={props.newDocumentPayload}
                    clearPayload={props.clearPayload}
                    defaultWarehouseId={props.defaultWarehouseId}
                    appMode={props.appMode}
                />;
      case 'balance':
        return <SupplierBalanceReport dataManager={props.dataManager} />;
      case 'payments_report':
        return <PaymentsReport dataManager={props.dataManager} />;
      case 'aging':
        return <AgingReport dataManager={props.dataManager} />;
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