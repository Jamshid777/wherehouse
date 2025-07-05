
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
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800">
      <aside className="w-64 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col">
        <div className="h-16 flex items-center justify-center border-b border-slate-200">
          <h1 className="text-xl font-bold text-slate-700">Ombor Nazorati</h1>
        </div>
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navigationItems.map(item => (
              <li key={item.id}>
                <button
                  onClick={() => handleNavigation(item.id as View)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeView === item.id
                      ? 'bg-blue-500 text-white shadow'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t border-slate-200">
            <p className="text-xs text-slate-400 text-center">© 2024 Omborxona tizimi</p>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8">
            {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
