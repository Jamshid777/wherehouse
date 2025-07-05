
import React, { useState, useMemo } from 'react';
import { ProductsView } from './components/ProductsView';
import { ManagementTabs } from './components/ManagementTabs';
import { useMockData } from './hooks/useMockData';
import { ProductIcon } from './components/icons/ProductIcon';
import { WarehouseIcon } from './components/icons/WarehouseIcon';
import { DocumentIcon } from './components/icons/DocumentIcon';
import { DocumentsView } from './components/DocumentsView';
import { ReportIcon } from './components/icons/ReportIcon';
import { ReportsView } from './components/ReportsView';
import { GoodsReceiptNote } from './types';


type View = 'products' | 'management' | 'documents' | 'reports';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('reports');
  const [viewToOpen, setViewToOpen] = useState<{view: View, payload: any} | null>(null);

  const dataManager = useMockData();

  const navigationItems = useMemo(() => [
    { id: 'reports', label: 'Hisobotlar', icon: <ReportIcon className="h-5 w-5" /> },
    { id: 'documents', label: 'Hujjatlar', icon: <DocumentIcon className="h-5 w-5" /> },
    { id: 'products', label: 'Mahsulotlar', icon: <ProductIcon className="h-5 w-5" /> },
    { id: 'management', label: "Ombor va Ta'minot", icon: <WarehouseIcon className="h-5 w-5" /> },
  ], []);
  
  const handleNavigation = (view: View, payload?: any) => {
    setActiveView(view);
    if(payload) {
       setViewToOpen({view, payload});
    } else {
        setViewToOpen(null);
    }
  }


  const renderContent = () => {
    switch (activeView) {
      case 'products':
        return <ProductsView dataManager={dataManager} />;
      case 'management':
        return <ManagementTabs dataManager={dataManager} />;
      case 'documents':
        return <DocumentsView dataManager={dataManager} newDocumentPayload={viewToOpen?.view === 'documents' ? viewToOpen.payload : null} clearPayload={() => setViewToOpen(null)} />;
      case 'reports':
        return <ReportsView dataManager={dataManager} navigate={handleNavigation} />;
      default:
        return <ReportsView dataManager={dataManager} navigate={handleNavigation} />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100 font-sans text-slate-800">
      <header className="flex-shrink-0 bg-white border-b border-slate-200 shadow-sm z-10">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-slate-700">Ombor Nazorati</h1>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center h-full">
            <div className="flex items-baseline space-x-1">
                {navigationItems.map(item => (
                <button
                    key={item.id}
                    onClick={() => handleNavigation(item.id as View)}
                    className={`h-16 flex items-center gap-2 px-4 text-sm font-medium transition-colors border-b-2 ${
                    activeView === item.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-blue-600 hover:border-blue-300'
                    }`}
                >
                    {item.icon}
                    <span>{item.label}</span>
                </button>
                ))}
            </div>
          </nav>

          {/* Mobile Navigation */}
           <nav className="flex md:hidden items-center">
            {navigationItems.map(item => (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id as View)}
                title={item.label}
                aria-label={item.label}
                className={`h-12 w-12 flex items-center justify-center rounded-lg transition-colors ${
                  activeView === item.id
                    ? 'bg-blue-500 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {React.cloneElement(item.icon, { className: "h-6 w-6" })}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8">
            {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
