
import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { UseMockDataReturnType } from '../hooks/useMockData';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    dataManager: UseMockDataReturnType;
    defaultWarehouseId: string | null;
    setDefaultWarehouseId: (id: string | null) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, dataManager, defaultWarehouseId, setDefaultWarehouseId }) => {
    const [selectedWarehouse, setSelectedWarehouse] = useState<string>(defaultWarehouseId || '');
    const { warehouses } = dataManager;

    useEffect(() => {
        if (isOpen) {
            setSelectedWarehouse(defaultWarehouseId || '');
        }
    }, [isOpen, defaultWarehouseId]);

    const handleSave = () => {
        setDefaultWarehouseId(selectedWarehouse || null);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Sozlamalar">
            <div className="space-y-6">
                <div>
                    <label htmlFor="defaultWarehouse" className="block text-sm font-medium text-slate-700 mb-2">
                        Standart (Default) Ombor
                    </label>
                    <p className="text-xs text-slate-500 mb-2">
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
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
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
