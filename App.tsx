
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
import { SettingsIcon } from './components/icons/SettingsIcon';
import { useSettings } from './hooks/useSettings';
import { SettingsModal } from './components/SettingsModal';


type View = 'products' | 'management' | 'documents' | 'reports';
type AppMode = 'lite' | 'pro';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('reports');
  const [viewToOpen, setViewToOpen] = useState<{view: View, payload: any} | null>(null);
  const [appMode, setAppMode] = useState<AppMode>('pro');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const dataManager = useMockData();
  const { defaultWarehouseId, setDefaultWarehouseId } = useSettings();

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
        return <DocumentsView 
                 dataManager={dataManager} 
                 newDocumentPayload={viewToOpen?.view === 'documents' ? viewToOpen.payload : null} 
                 clearPayload={() => setViewToOpen(null)}
                 defaultWarehouseId={defaultWarehouseId}
               />;
      case 'reports':
        return <ReportsView dataManager={dataManager} navigate={handleNavigation} defaultWarehouseId={defaultWarehouseId} />;
      default:
        return <ReportsView dataManager={dataManager} navigate={handleNavigation} defaultWarehouseId={defaultWarehouseId} />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100 font-sans text-slate-800">
      <header className="flex-shrink-0 bg-white border-b border-slate-200 shadow-sm z-10">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-slate-700">Ombor Nazorati</h1>
            <div className="ml-4 flex items-center p-1 bg-slate-200/70 rounded-full text-xs font-semibold">
                <button
                    onClick={() => setAppMode('lite')}
                    className={`px-3 py-1 rounded-full transition-all duration-300 ${
                        appMode === 'lite' 
                        ? 'bg-white text-slate-800 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    Lite
                </button>
                <button
                    onClick={() => setAppMode('pro')}
                    className={`px-3 py-1 rounded-full transition-all duration-300 ${
                        appMode === 'pro' 
                        ? 'bg-white text-amber-600 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    Pro
                </button>
            </div>
          </div>
          
          {appMode === 'pro' && (
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
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        {appMode === 'pro' ? (
            <div className="p-6 lg:p-8">
                {renderContent()}
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="max-w-md">
                    <svg className="mx-auto h-16 w-16 text-amber-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.472-2.472a3.375 3.375 0 00-4.773-4.773L6.75 15.75l-2.472 2.472a3.375 3.375 0 004.773 4.773L11.42 15.17z" />
                    </svg>
                    <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
                        "Lite" versiyasi tez kunda...
                    </h2>
                    <p className="mt-4 text-base text-slate-500">
                        Hozirda ilovaning soddalashtirilgan va tezkor "Lite" versiyasi ustida ish olib bormoqdamiz. Ushbu versiya ishlab chiqish jarayonida. Hozircha "Pro" versiyasidan foydalanib turishingiz mumkin.
                    </p>
                </div>
            </div>
        )}
      </main>
      <SettingsModal 
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        dataManager={dataManager}
        defaultWarehouseId={defaultWarehouseId}
        setDefaultWarehouseId={setDefaultWarehouseId}
      />
    </div>
  );
};

export default App;
