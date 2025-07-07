

import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { UseMockDataReturnType } from '../hooks/useMockData';
import { WarningIcon } from './icons/WarningIcon';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    dataManager: UseMockDataReturnType;
    defaultWarehouseId: string | null;
    setDefaultWarehouseId: (id: string | null) => void;
    appMode: 'pro' | 'lite';
    setAppMode: (mode: 'pro' | 'lite') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, dataManager, defaultWarehouseId, setDefaultWarehouseId, appMode, setAppMode }) => {
    const [selectedWarehouse, setSelectedWarehouse] = useState<string>(defaultWarehouseId || '');
    const [selectedMode, setSelectedMode] = useState<'pro' | 'lite'>(appMode);
    const { warehouses } = dataManager;

    useEffect(() => {
        if (isOpen) {
            setSelectedWarehouse(defaultWarehouseId || '');
            setSelectedMode(appMode);
        }
    }, [isOpen, defaultWarehouseId, appMode]);

    const handleSave = () => {
        setDefaultWarehouseId(selectedWarehouse || null);
        setAppMode(selectedMode);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Sozlamalar">
            <div className="space-y-6 divide-y divide-slate-200">
                <div className="pt-6 first:pt-0">
                    <h3 className="text-lg font-medium text-slate-900">Ilova rejimi</h3>
                     <p className="text-xs text-slate-500 mt-1 mb-3">
                        Ilovaning funksionalligini o'zgartiring.
                    </p>
                    <div className="space-y-2">
                        <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                            <input type="radio" name="appMode" value="pro" checked={selectedMode === 'pro'} onChange={() => setSelectedMode('pro')} className="h-4 w-4 text-amber-600 border-slate-300 focus:ring-amber-500" />
                            <span className="ml-3">
                                <span className="font-semibold text-slate-800">Pro</span>
                                <span className="block text-sm text-slate-500">To'liq funksionallik: partiyalar, yaroqlilik muddatlari, FIFO.</span>
                            </span>
                        </label>
                         <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                            <input type="radio" name="appMode" value="lite" checked={selectedMode === 'lite'} onChange={() => setSelectedMode('lite')} className="h-4 w-4 text-amber-600 border-slate-300 focus:ring-amber-500" />
                             <span className="ml-3">
                                <span className="font-semibold text-slate-800">Lite</span>
                                <span className="block text-sm text-slate-500">Soddalashtirilgan interfeys, asosiy ombor operatsiyalari.</span>
                            </span>
                        </label>
                    </div>
                </div>

                <div className="pt-6">
                    <h3 className="text-lg font-medium text-slate-900">Standart (Default) Ombor</h3>
                    <p className="text-xs text-slate-500 mt-1 mb-3">
                        Yangi hujjatlar yaratilganda ushbu ombor avtomatik tarzda tanlanadi.
                    </p>
                    <select
                        id="defaultWarehouse"
                        value={selectedWarehouse}
                        onChange={(e) => setSelectedWarehouse(e.target.value)}
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500"
                    >
                        <option value="">Tanlanmagan</option>
                        {warehouses.filter(w => w.is_active).map(w => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                    </select>
                </div>
                
                <div className="flex justify-end gap-3 pt-6">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200">
                        Bekor qilish
                    </button>
                    <button type="button" onClick={handleSave} className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700">
                        Saqlash
                    </button>
                </div>
            </div>
        </Modal>
    );
};