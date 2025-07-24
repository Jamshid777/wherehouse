
import React, { useState, useMemo } from 'react';
import { useMockData } from './hooks/useMockData';
import { ProductIcon } from './components/icons/ProductIcon';
import { SupplierIcon } from './components/icons/SupplierIcon';
import { SettingsIcon } from './components/icons/SettingsIcon';
import { useSettings } from './hooks/useSettings';
import { SettingsModal } from './components/SettingsModal';
import { WarningIcon } from './components/icons/WarningIcon';
import { ProductsHubView } from './components/ProductsHubView';
import { SuppliersHubView } from './components/SuppliersHubView';
import { WarehousesHubView } from './components/WarehousesHubView';
import { WarehouseIcon } from './components/icons/WarehouseIcon';


type View = 'products' | 'suppliers' | 'warehouses';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('products');
  const [viewToOpen, setViewToOpen] = useState<{view: View, payload: any} | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const dataManager = useMockData();
  const { defaultWarehouseId, setDefaultWarehouseId, appMode, setAppMode } = useSettings();

  const navigationItems = useMemo(() => [
    { id: 'products', label: 'Mahsulotlar', icon: <ProductIcon className="h-5 w-5" /> },
    { id: 'suppliers', label: "Ta'minotchilar", icon: <SupplierIcon className="h-5 w-5" /> },
    { id: 'warehouses', label: 'Omborlar', icon: <WarehouseIcon className="h-5 w-5" /> },
  ], []);
  
  const handleNavigation = (view: 'documents' | View, payload?: any) => {
    let targetView: View;
    let newPayload = payload;

    if (view === 'documents') {
        targetView = 'suppliers';
        newPayload = { ...payload, targetTab: 'documents' };
    } else {
        targetView = view;
    }
    
    setActiveView(targetView);

    if (newPayload) {
       setViewToOpen({view: targetView, payload: newPayload});
    } else {
        setViewToOpen(null);
    }
  }


  const renderContent = () => {
    switch (activeView) {
      case 'products':
        return <ProductsHubView 
                 dataManager={dataManager} 
                 navigate={handleNavigation}
                 defaultWarehouseId={defaultWarehouseId}
                 appMode={appMode}
               />;
      case 'suppliers':
        return <SuppliersHubView 
                  dataManager={dataManager} 
                  newDocumentPayload={viewToOpen?.view === 'suppliers' ? viewToOpen.payload : null} 
                  clearPayload={() => setViewToOpen(null)}
                  defaultWarehouseId={defaultWarehouseId}
                  appMode={appMode}
                />;
      case 'warehouses':
        return <WarehousesHubView 
                  dataManager={dataManager} 
                  defaultWarehouseId={defaultWarehouseId}
                />;
      default:
        return <ProductsHubView dataManager={dataManager} navigate={handleNavigation} defaultWarehouseId={defaultWarehouseId} appMode={appMode} />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100 font-sans text-slate-800">
      <header className="flex-shrink-0 bg-white border-b border-slate-200 shadow-sm z-10">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-slate-700">
                Ombor Nazorati 
                {appMode === 'pro' && <span className="ml-2 text-xs font-semibold text-amber-600 bg-amber-100 px-2 py-1 rounded-full align-middle">PRO</span>}
                {appMode === 'lite' && <span className="ml-2 text-xs font-semibold text-sky-600 bg-sky-100 px-2 py-1 rounded-full align-middle">LITE</span>}
            </h1>
          </div>
          
            {appMode === 'pro' ? (
                <>
                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center h-full space-x-4">
                        <div className="flex items-baseline space-x-1">
                            {navigationItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => handleNavigation(item.id as View)}
                                className={`h-16 flex items-center gap-2 px-4 text-sm font-medium transition-colors border-b-2 ${
                                activeView === item.id
                                    ? 'border-amber-500 text-amber-600'
                                    : 'border-transparent text-slate-500 hover:text-amber-600 hover:border-amber-300'
                                }`}
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </button>
                            ))}
                        </div>
                         <div className="h-full flex items-center border-l border-slate-200 pl-4">
                           <button
                               onClick={() => setIsSettingsModalOpen(true)}
                               title="Sozlamalar"
                               aria-label="Sozlamalar"
                               className="h-10 w-10 flex items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 hover:text-amber-600 transition-colors"
                            >
                               <SettingsIcon className="h-6 w-6" />
                            </button>
                        </div>
                    </nav>

                    {/* Mobile Navigation */}
                    <nav className="flex md:hidden items-center space-x-1">
                        {navigationItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => handleNavigation(item.id as View)}
                            title={item.label}
                            aria-label={item.label}
                            className={`h-10 w-10 flex items-center justify-center rounded-lg transition-colors ${
                            activeView === item.id
                                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white'
                                : 'text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            {React.cloneElement(item.icon, { className: "h-6 w-6" })}
                        </button>
                        ))}
                         <button onClick={() => setIsSettingsModalOpen(true)} title="Sozlamalar" aria-label="Sozlamalar" className="h-10 w-10 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-200">
                            <SettingsIcon className="h-6 w-6" />
                        </button>
                    </nav>
                </>
            ) : (
                <button
                   onClick={() => setIsSettingsModalOpen(true)}
                   title="Sozlamalar"
                   aria-label="Sozlamalar"
                   className="h-10 w-10 flex items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 hover:text-amber-600 transition-colors"
                >
                   <SettingsIcon className="h-6 w-6" />
                </button>
            )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8 h-full">
            {appMode === 'lite' ? (
                <div className="flex justify-center items-center h-full">
                    <div className="max-w-xl text-center p-8 bg-white rounded-xl shadow-md border border-amber-200">
                        <WarningIcon className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                        <p className="text-lg text-slate-700">
                            Hozirda lite versiya ustida ish olib bormoqdamiz. Hozircha ilovamizning pro versiyasidan foydalanib turishingiz mumkin.
                        </p>
                    </div>
                </div>
            ) : (
                renderContent()
            )}
        </div>
      </main>
      <SettingsModal 
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        dataManager={dataManager}
        defaultWarehouseId={defaultWarehouseId}
        setDefaultWarehouseId={setDefaultWarehouseId}
        appMode={appMode}
        setAppMode={setAppMode}
      />
    </div>
  );
};

export default App;
