import React, { useState, useMemo } from 'react';
import { UseMockDataReturnType } from '../hooks/useMockData';
import { Dish, Warehouse, Recipe, RecipeItem, Unit } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { EditIcon } from './icons/EditIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ProductionIcon } from './icons/ProductionIcon';
import { ConfirmationModal } from './ConfirmationModal';
import { DishFormModal } from './forms/DishFormModal';

const formatCurrency = (amount: number) => new Intl.NumberFormat('uz-UZ').format(amount);

export const DishesView: React.FC<{ dataManager: UseMockDataReturnType, defaultWarehouseId: string | null }> = ({ dataManager, defaultWarehouseId }) => {
    const { dishes, recipes, warehouses, addDish, updateDish, deleteDish, produceDishes, calculateProducibleQuantity, getTotalStockQuantity } = dataManager;
    
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingDish, setEditingDish] = useState<Dish | null>(null);
    const [dishToDelete, setDishToDelete] = useState<string | null>(null);
    const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(defaultWarehouseId || warehouses.find(w => w.is_active)?.id || '');
    const [plannedQuantities, setPlannedQuantities] = useState<Map<string, number>>(new Map());
    const [showProductionConfirm, setShowProductionConfirm] = useState(false);

    const producibleQuantities = useMemo(() => {
        const map = new Map<string, number>();
        if (selectedWarehouseId) {
            dishes.forEach(dish => {
                map.set(dish.id, calculateProducibleQuantity(dish.id, selectedWarehouseId));
            });
        }
        return map;
    }, [dishes, selectedWarehouseId, calculateProducibleQuantity, dataManager.stock]);

    const handleOpenFormModal = (dish: Dish | null) => {
        setEditingDish(dish);
        setIsFormModalOpen(true);
    };

    const handleCloseFormModal = () => {
        setEditingDish(null);
        setIsFormModalOpen(false);
    };

    const handleSaveDish = (dishData: Omit<Dish, 'id'>, recipeData: Omit<Recipe, 'dishId'>) => {
        if (editingDish) {
            updateDish({ ...dishData, id: editingDish.id }, recipeData);
        } else {
            addDish(dishData, recipeData);
        }
        handleCloseFormModal();
    };

    const handleDeleteClick = (dishId: string) => {
        setDishToDelete(dishId);
    };

    const handleConfirmDelete = () => {
        if (dishToDelete) {
            deleteDish(dishToDelete);
            setDishToDelete(null);
        }
    };
    
    const handlePlanQuantityChange = (dishId: string, quantityStr: string) => {
        const newPlan = new Map(plannedQuantities);
        const quantity = parseFloat(quantityStr);

        if (!isNaN(quantity) && quantity > 0) {
            const maxQty = producibleQuantities.get(dishId) || 0;
            if (quantity > maxQty) {
                alert(`Xatolik: Ombordagi xomashyo faqat ${maxQty} dona tayyorlashga yetadi.`);
                newPlan.set(dishId, maxQty);
            } else {
                newPlan.set(dishId, quantity);
            }
        } else {
            newPlan.delete(dishId);
        }
        setPlannedQuantities(newPlan);
    };

    const handleProduceConfirm = () => {
        if (!selectedWarehouseId) { alert("Iltimos, omborni tanlang."); return; }
        if (plannedQuantities.size === 0) { alert("Ishlab chiqarish uchun miqdorlar kiritilmagan."); return; }
        
        try {
            const plan = Array.from(plannedQuantities.entries()).map(([dishId, quantity]) => ({ dishId, quantity }));
            produceDishes(selectedWarehouseId, plan);
            setPlannedQuantities(new Map());
            alert("Ishlab chiqarish muvaffaqiyatli amalga oshirildi! Xomashyolar ombordan yechildi va tayyor mahsulotlar omborga qo'shildi.");
        } catch (error: any) {
            alert(`Xatolik: ${error.message}`);
        }
        setShowProductionConfirm(false);
    };

    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-800">Tayyor Mahsulotlar Ro'yxati</h2>
                    <button onClick={() => handleOpenFormModal(null)} className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2.5 rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all shadow">
                        <PlusIcon className="h-5 w-5" />
                        <span>Yangi tayyor mahsulot qo'shish</span>
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 tracking-wider">
                            <tr>
                                <th className="px-6 py-3 border-r">Nomi</th>
                                <th className="px-6 py-3 border-r">Kategoriyasi</th>
                                <th className="px-6 py-3 text-right border-r">Sotish narxi</th>
                                <th className="px-6 py-3 text-center">Amallar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {dishes.map(dish => (
                                <tr key={dish.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-900 border-r">{dish.name}</td>
                                    <td className="px-6 py-4 text-slate-600 border-r">{dish.category}</td>
                                    <td className="px-6 py-4 text-right font-mono border-r">{formatCurrency(dish.price)}</td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center items-center gap-2">
                                            <button onClick={() => handleOpenFormModal(dish)} className="p-2 rounded-full text-amber-600 hover:bg-amber-50"><EditIcon className="h-5 w-5"/></button>
                                            <button onClick={() => handleDeleteClick(dish.id)} className="p-2 rounded-full text-red-600 hover:bg-red-50"><TrashIcon className="h-5 w-5"/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <h2 className="text-2xl font-bold text-slate-800">Ishlab Chiqarish Paneli</h2>
                    <div>
                        <label htmlFor="warehouseId" className="block text-sm font-medium text-slate-700 mb-1">Ombor</label>
                        <select id="warehouseId" value={selectedWarehouseId} onChange={(e) => setSelectedWarehouseId(e.target.value)} className="w-full md:w-64 px-3 py-2.5 border border-slate-300 rounded-lg">
                            <option value="" disabled>Omborni tanlang</option>
                            {warehouses.filter(w=>w.is_active).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                    </div>
                </div>
                <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-sm">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium border-r w-2/5">Tayyor mahsulot nomi</th>
                                <th className="px-4 py-3 text-right font-medium border-r">Hozirgi qoldiq</th>
                                <th className="px-4 py-3 text-right font-medium border-r">Tayyorlash mumkin</th>
                                <th className="px-4 py-3 text-right font-medium">Rejalashtirilgan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {dishes.map(dish => {
                                const producibleQty = producibleQuantities.get(dish.id) || 0;
                                const plannedQty = plannedQuantities.get(dish.id) || '';
                                const currentStock = selectedWarehouseId ? getTotalStockQuantity({ dishId: dish.id }, selectedWarehouseId) : 0;
                                const recipeUnit = recipes.find(r => r.dishId === dish.id)?.unit;

                                return (
                                    <tr key={dish.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-2 font-medium text-slate-800 border-r">{dish.name}</td>
                                        <td className="px-4 py-2 text-right font-mono font-semibold text-sky-700 border-r">{currentStock.toFixed(2)} {recipeUnit}</td>
                                        <td className="px-4 py-2 text-right font-mono text-slate-600 border-r">{producibleQty.toFixed(2)} {recipeUnit}</td>
                                        <td className="px-2 py-2 text-right">
                                            <input 
                                                type="number" 
                                                value={plannedQty}
                                                onChange={(e) => handlePlanQuantityChange(dish.id, e.target.value)}
                                                placeholder="0.00"
                                                min="0"
                                                max={producibleQty}
                                                step="any"
                                                className="w-32 px-2 py-1.5 border border-slate-300 rounded-md text-right"
                                                disabled={!selectedWarehouseId}
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="mt-6 flex justify-end">
                    <button onClick={() => setShowProductionConfirm(true)} disabled={plannedQuantities.size === 0} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-5 py-3 rounded-lg shadow disabled:opacity-50">
                        <ProductionIcon className="h-5 w-5" />
                        <span className="font-semibold">Rejadagilarni Ishlab Chiqarish</span>
                    </button>
                </div>
            </div>

            <DishFormModal 
                isOpen={isFormModalOpen}
                onClose={handleCloseFormModal}
                onSubmit={handleSaveDish}
                dish={editingDish}
                dataManager={dataManager}
            />
            <ConfirmationModal
                isOpen={!!dishToDelete}
                onClose={() => setDishToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Tayyor mahsulotni o'chirish"
                message="Haqiqatan ham bu tayyor mahsulotni va uning retseptini o'chirmoqchimisiz?"
            />
             <ConfirmationModal
                isOpen={showProductionConfirm}
                onClose={() => setShowProductionConfirm(false)}
                onConfirm={handleProduceConfirm}
                title="Ishlab chiqarishni tasdiqlash"
                message={<>Rejalashtirilgan barcha tayyor mahsulotlar uchun kerakli xomashyolar ombordan hisobdan chiqariladi va tayyor mahsulotlar omborga kirim qilinadi. Davom etasizmi?</>}
                confirmButtonText="Ha, ishlab chiqarish"
            />
        </div>
    );
};