
import React, { useState, useEffect } from 'react';
import { Modal } from '../Modal';
import { Product, Unit } from '../../types';

export interface ProductFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Omit<Product, 'id'> | Product) => void;
    product: Product | null;
    products: Product[];
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({isOpen, onClose, onSubmit, product, products}) => {
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        category: '',
        unit: Unit.KG,
        min_stock: 0,
    });

    useEffect(() => {
        if(isOpen){
            if(product){
                setFormData({
                    name: product.name,
                    sku: product.sku,
                    category: product.category,
                    unit: product.unit,
                    min_stock: product.min_stock,
                });
            } else {
                const maxSkuNum = products.reduce((max, p) => {
                    const match = p.sku.match(/\d+$/);
                    if (match) {
                        const num = parseInt(match[0], 10);
                        if (!isNaN(num)) {
                            return Math.max(max, num);
                        }
                    }
                    return max;
                }, 0);
                
                const nextSku = `SKU-${(maxSkuNum + 1).toString().padStart(3, '0')}`;

                setFormData({
                    name: '', 
                    sku: nextSku, 
                    category: '', 
                    unit: Unit.KG, 
                    min_stock: 0,
                });
            }
        }
    }, [product, isOpen, products]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: name === 'min_stock' ? parseFloat(value) || 0 : value}));
    }

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(product){
            onSubmit({...formData, id: product.id});
        } else {
            onSubmit(formData);
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={product ? "Mahsulotni tahrirlash" : "Yangi mahsulot qo'shish"} closeOnOverlayClick={false}>
            <form onSubmit={handleFormSubmit} className="space-y-4">
                 <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Mahsulot nomi</label>
                    <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500" />
                </div>
                 <div>
                    <label htmlFor="sku" className="block text-sm font-medium text-slate-700 mb-1">SKU (Artikul)</label>
                    <input 
                        type="text" 
                        name="sku" 
                        id="sku" 
                        value={formData.sku} 
                        readOnly 
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500 bg-slate-100 cursor-not-allowed" 
                    />
                </div>
                 <div>
                    <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1">Kategoriya</label>
                    <input type="text" name="category" id="category" value={formData.category} onChange={handleChange} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500" />
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="unit" className="block text-sm font-medium text-slate-700 mb-1">O'lchov birligi</label>
                        <select name="unit" id="unit" value={formData.unit} onChange={handleChange} required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500">
                            {Object.values(Unit).map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="min_stock" className="block text-sm font-medium text-slate-700 mb-1">Minimal zaxira</label>
                        <input type="number" name="min_stock" id="min_stock" value={formData.min_stock} onChange={handleChange} required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500" />
                    </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200">Bekor qilish</button>
                    <button type="submit" className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700">Saqlash</button>
                </div>
            </form>
        </Modal>
    );
}