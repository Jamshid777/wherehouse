
import React, { useState, useMemo } from 'react';
import { UseMockDataReturnType } from '../../hooks/useMockData';
import { ProductionIcon } from '../icons/ProductionIcon';
import { LinkIcon } from '../icons/LinkIcon';
import { Dish, Warehouse, Unit } from '../../types';
import { Modal } from '../Modal';
import { PlusIcon } from '../icons/PlusIcon';
import { EditIcon } from '../icons/EditIcon';

interface ProductionReportProps {
    dataManager: UseMockDataReturnType;
}

interface ProductionQuantityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (dishId: string, quantity: number) => void;
    dish: Dish | null;
    producibleQuantity: number;
    plannedQuantity: number | undefined;
}

const ProductionQuantityModal: React.FC<ProductionQuantityModalProps> = ({ isOpen, onClose, onSave, dish, producibleQuantity, plannedQuantity }) => {
    const [quantity, setQuantity] = useState<string>('');

    React.useEffect(() => {
        if (isOpen) {
            setQuantity(plannedQuantity?.toString() || '');
        }
    }, [isOpen, plannedQuantity]);

    const handleSave = () => {
        const numQuantity = parseFloat(quantity);
        if (dish && !isNaN(numQuantity) && numQuantity > 0) {
            if (numQuantity > producibleQuantity) {
                alert(`Xatolik: Ombordagi xomashyo faqat ${producibleQuantity} ${dish.unit} tayyorlashga yetadi.`);
                return;
            }
            onSave(dish.id, numQuantity);
        } else {
             alert('Iltimos, to\'g\'ri miqdor kiriting.');
        }
    };

    if (!dish) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${dish.name}: Miqdor kiritish`}>
            <div className="space-y-4">
                <p className="text-sm text-slate-600">
                    Ombordagi xomashyo qoldig'idan kelib chiqib, bu taomdan maksimal <span className="font-bold text-amber-600">{producibleQuantity} {dish.unit}</span> tayyorlash mumkin.
                </p>
                <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-slate-700 mb-1">
                        Tayyorlanadigan miqdor ({dish.unit})
                    </label>
                    <input
                        id="quantity"
                        type="number"
                        value={quantity}
                        onChange={e => setQuantity(e.target.value)}
                        min="0"
                        max={producibleQuantity}
                        step="any"
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                        placeholder="0.00"
                    />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200">
                        Bekor qilish
                    </button>
                    <button onClick={handleSave} className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700">
                        Saqlash
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export const ProductionReport: React.FC<ProductionReportProps> = ({ dataManager }) => {
    const { dishes, warehouses, calculateProducibleQuantity } = dataManager;
    const [plannedQuantities, setPlannedQuantities] = useState<Map<string, number>>(new Map());
    const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(warehouses.find(w => w.is_active)?.id || '');
    
    const [modalState, setModalState] = useState<{ isOpen: boolean; dish: Dish | null; producible: number; planned: number | undefined }>({
        isOpen: false,
        dish: null,
        producible: 0,
        planned: undefined,
    });
    
    const producibleQuantities = useMemo(() => {
        const map = new Map<string, number>();
        if (selectedWarehouseId) {
            dishes.forEach(dish => {
                map.set(dish.id, calculateProducibleQuantity(dish.id, selectedWarehouseId));
            });
        }
        return map;
    }, [dishes, selectedWarehouseId, calculateProducibleQuantity]);
    
    const handleOpenModal = (dish: Dish) => {
        setModalState({
            isOpen: true,
            dish,
            producible: producibleQuantities.get(dish.id) || 0,
            planned: plannedQuantities.get(dish.id)
        });
    };

    const handleCloseModal = () => {
         setModalState({ isOpen: false, dish: null, producible: 0, planned: undefined });
    };

    const handleSaveQuantity = (dishId: string, quantity: number) => {
        const newQuantities = new Map(plannedQuantities);
        newQuantities.set(dishId, quantity);
        setPlannedQuantities(newQuantities);
        handleCloseModal();
    };


    const handleProduce = () => {
        if (plannedQuantities.size === 0) {
            alert("Ishlab chiqarish uchun miqdor kiritilmagan.");
            return;
        }
        // This is where the logic for creating a WriteOffNote would go.
        // For now, we just show an alert as requested.
        const itemsToProduce: { dishId: string, quantity: number, name: string }[] = [];
        plannedQuantities.forEach((value, key) => {
            const dish = dishes.find(d => d.id === key);
            if (dish) {
                itemsToProduce.push({ dishId: key, quantity: value, name: dish.name });
            }
        });
        
        const productionList = itemsToProduce.map(item => `${item.name}: ${item.quantity}`).join('\n');
        console.log("Tayyorlanadigan taomlar:", itemsToProduce);
        alert(`Quyidagi taomlar uchun xomashyo hisobdan yechiladi (kelajakda):\n\n${productionList}\n\nHozircha bu funksiya ishlab chiqilmoqda. Ma'lumotlar konsolga chiqarildi.`);
    };

    return (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
             <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Taomlar</h2>
                <div>
                    <label htmlFor="warehouseId" className="block text-sm font-medium text-slate-700 mb-1">Ombor</label>
                    <select
                        id="warehouseId"
                        name="warehouseId"
                        value={selectedWarehouseId}
                        onChange={(e) => setSelectedWarehouseId(e.target.value)}
                        className="w-full md:w-64 px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition text-sm"
                    >
                        <option value="" disabled>Omborni tanlang</option>
                        {warehouses.filter(w=>w.is_active).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 tracking-wider">
                        <tr>
                            <th scope="col" className="px-4 py-3 text-left font-medium border-r w-2/5">Taom nomi</th>
                            <th scope="col" className="px-4 py-3 text-right font-medium border-r w-1/5">Tayyorlash mumkin</th>
                            <th scope="col" className="px-4 py-3 text-right font-medium border-r w-1/5">Rejalashtirilgan</th>
                            <th scope="col" className="px-4 py-3 text-center font-medium">Amallar</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {dishes.map(dish => {
                            const producibleQty = producibleQuantities.get(dish.id) || 0;
                            const plannedQty = plannedQuantities.get(dish.id);
                            return (
                                <tr key={dish.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 font-medium text-slate-800 border-r">
                                        <div className="flex items-center gap-2">
                                            <span>{dish.name}</span>
                                            <a
                                                href={dish.techCardUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                title={`${dish.name} texnologik kartasi`}
                                                className="inline-flex items-center justify-center h-8 w-8 rounded-full text-slate-400 hover:bg-slate-100 hover:text-amber-600 transition-colors"
                                            >
                                                <LinkIcon className="h-4 w-4" />
                                            </a>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-slate-600 border-r">
                                        {producibleQty.toFixed(2)} <span className="text-xs">{dish.unit}</span>
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-amber-700 font-semibold border-r">
                                        {plannedQty ? `${plannedQty.toFixed(2)} ${dish.unit}` : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            onClick={() => handleOpenModal(dish)}
                                            title="Miqdorni kiritish"
                                            className="p-2 rounded-full text-amber-600 hover:bg-amber-100 transition-colors"
                                        >
                                            {plannedQty ? <EditIcon className="h-5 w-5" /> : <PlusIcon className="h-5 w-5" />}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="mt-6 flex justify-end">
                <button
                    onClick={handleProduce}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-5 py-3 rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all shadow disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={plannedQuantities.size === 0}
                    aria-label="Taomlarni tayyorlashni tasdiqlash"
                >
                    <ProductionIcon className="h-5 w-5" />
                    <span className="font-semibold">Taomlarni tayyorlash</span>
                </button>
            </div>
             <ProductionQuantityModal 
                isOpen={modalState.isOpen}
                onClose={handleCloseModal}
                onSave={handleSaveQuantity}
                dish={modalState.dish}
                producibleQuantity={modalState.producible}
                plannedQuantity={modalState.planned}
            />
        </div>
    );
};
