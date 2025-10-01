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
import { PriceCorrectIcon } from './icons/PriceCorrectIcon';
import { PriceAdjustmentsView } from './PriceAdjustmentsView';

interface SuppliersHubViewProps {
  dataManager: UseMockDataReturnType;
  newDocumentPayload: any; 
  clearPayload: () => void;
  defaultWarehouseId: string | null;
  appMode: 'pro' | 'lite';
}

type ActiveTab = 'list' | 'documents' | 'adjustments' | 'balance' | 'payments_report' | 'aging';

const tabs = [
    { id: 'documents', label: 'Hujjatlar', icon: DocumentIcon },
    { id: 'adjustments', label: 'Narx Korrektirovkasi', icon: PriceCorrectIcon },
    { id: 'balance', label: 'Balans Hisoboti', icon: SupplierBalanceIcon },
    { id: 'payments_report', label: 'To\'lovlar Hisoboti', icon: PaymentIcon },
    { id: 'aging', label: 'Qarzdorlik Muddati', icon: ClockIcon },
    { id: 'list', label: "Ta'minotchilar Ro'yxati", icon: SupplierIcon },
];

export const SuppliersHubView: React.FC<SuppliersHubViewProps> = (props) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('documents');

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
      case 'adjustments':
        return <PriceAdjustmentsView dataManager={props.dataManager} />;
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