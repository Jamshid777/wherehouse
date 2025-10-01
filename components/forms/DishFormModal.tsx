import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../Modal';
import { Dish, Recipe, RecipeItem, Unit, Product } from '../../types';
import { UseMockDataReturnType } from '../../hooks/useMockData';
import { PlusIcon } from '../icons/PlusIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { SearchableSelect, SearchableOption } from '../SearchableSelect';

interface DishFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (dishData: Omit<Dish, 'id'>, recipeData: Omit<Recipe, 'dishId'>) => void;
    dish: Dish | null;
    dataManager: UseMockDataReturnType;
}

const initialDishState = { name: '', category: '', price: 0 };
const initialRecipeState = { outputYield: 1, unit: Unit.PORTSIYA, items: [] as RecipeItem[] };

export const DishFormModal: React.FC<DishFormModalProps> = ({ isOpen, onClose, onSubmit, dish, dataManager }) => {
    const { products, recipes } = dataManager;
    const [dishData, setDishData] = useState(initialDishState);
    const [recipeData, setRecipeData] = useState(initialRecipeState);

    const productOptions = useMemo<SearchableOption[]>(() => 
        products.map(p => ({ value: p.id, label: `${p.name} (${p.unit})` })),
        [products]
    );

    useEffect(() => {
        if (isOpen) {
            if (dish) {
                const recipe = recipes.find(r => r.dishId === dish.id);
                setDishData({ name: dish.name, category: dish.category, price: dish.price });
                setRecipeData(recipe ? { ...recipe, items: [...recipe.items] } : initialRecipeState);
            } else {
                setDishData(initialDishState);
                setRecipeData(initialRecipeState);
            }
        }
    }, [isOpen, dish, recipes]);

    const handleDishChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setDishData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
    };
    
    const handleRecipeHeaderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setRecipeData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value as Unit }));
    };

    const handleItemChange = (index: number, field: keyof RecipeItem, value: string | number) => {
        const newItems = [...recipeData.items];
        (newItems[index] as any)[field] = value;
        setRecipeData(prev => ({ ...prev, items: newItems }));
    };

    const handleAddItem = () => {
        setRecipeData(prev => ({
            ...prev,
            items: [...prev.items, { productId: '', grossQuantity: 0, netQuantity: 0 }]
        }));
    };
    
    const handleRemoveItem = (index: number) => {
        setRecipeData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalRecipeItems = recipeData.items.filter(item => item.productId && item.grossQuantity > 0 && item.netQuantity > 0);
        if (finalRecipeItems.length === 0) {
            alert("Iltimos, kamida bitta to'g'ri ingredient kiriting.");
            return;
        }
        onSubmit(dishData, { ...recipeData, items: finalRecipeItems });
    };
    
    const calculateLoss = (gross: number, net: number) => {
        if (gross <= 0 || net > gross) return 0;
        return ((gross - net) / gross) * 100;
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={dish ? "Tayyor mahsulotni tahrirlash" : "Yangi tayyor mahsulot va retsept qo'shish"} size="fullscreen" closeOnOverlayClick={false}>
            <form onSubmit={handleFormSubmit} className="flex flex-col h-full">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 pb-4 border-b flex-shrink-0">
                    <div>
                        <label className="block text-sm font-medium">Tayyor mahsulot nomi</label>
                        <input type="text" name="name" value={dishData.name} onChange={handleDishChange} required className="w-full mt-1 p-2 border rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Kategoriyasi</label>
                        <input type="text" name="category" value={dishData.category} onChange={handleDishChange} required className="w-full mt-1 p-2 border rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Sotish narxi</label>
                        <input type="number" name="price" value={dishData.price} onChange={handleDishChange} required className="w-full mt-1 p-2 border rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Chiqish miqdori</label>
                        <input type="number" name="outputYield" value={recipeData.outputYield} onChange={handleRecipeHeaderChange} required className="w-full mt-1 p-2 border rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">O'lchov birligi</label>
                        <select name="unit" value={recipeData.unit} onChange={handleRecipeHeaderChange} required className="w-full mt-1 p-2 border rounded-md bg-white">
                            {Object.values(Unit).map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex-1 py-4">
                    <h3 className="text-lg font-semibold mb-2">Retsept Ingredientlari</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="p-2 text-left font-medium w-2/5">Ingredient</th>
                                    <th className="p-2 text-left font-medium">Brutto</th>
                                    <th className="p-2 text-left font-medium">Netto</th>
                                    <th className="p-2 text-left font-medium">Yo'qotish %</th>
                                    <th className="p-2"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {recipeData.items.map((item, index) => (
                                    <tr key={index} className="border-b">
                                        <td className="p-1"><SearchableSelect options={productOptions} value={item.productId} onChange={(val) => handleItemChange(index, 'productId', val || '')} /></td>
                                        <td className="p-1"><input type="number" value={item.grossQuantity} onChange={e => handleItemChange(index, 'grossQuantity', parseFloat(e.target.value) || 0)} min="0" step="any" className="w-full p-2 border rounded-md" /></td>
                                        <td className="p-1"><input type="number" value={item.netQuantity} onChange={e => handleItemChange(index, 'netQuantity', parseFloat(e.target.value) || 0)} min="0" step="any" className="w-full p-2 border rounded-md" /></td>
                                        <td className="p-1 font-mono text-center">{calculateLoss(item.grossQuantity, item.netQuantity).toFixed(1)}%</td>
                                        <td className="p-1 text-center"><button type="button" onClick={() => handleRemoveItem(index)} className="p-2 text-red-500 hover:text-red-700"><TrashIcon className="h-5 w-5"/></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <button type="button" onClick={handleAddItem} className="mt-4 flex items-center gap-2 text-sm text-amber-600 hover:text-amber-800 font-medium">
                        <PlusIcon className="h-4 w-4"/> Ingredient qo'shish
                    </button>
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t flex-shrink-0">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200">Bekor qilish</button>
                    <button type="submit" className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700">Saqlash</button>
                </div>
            </form>
        </Modal>
    );
};