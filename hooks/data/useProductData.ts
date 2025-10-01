import { useState } from 'react';
import { Product, Recipe } from '../../types';

export const useProductData = (initialProducts: Product[], recipes: Recipe[]) => {
  const [products, setProducts] = useState<Product[]>(initialProducts);

  const addProduct = (product: Omit<Product, 'id'>): Product => {
    const newProduct = { ...product, id: `p${Date.now()}` };
    setProducts(prev => [newProduct, ...prev]);
    return newProduct;
  };

  const updateProduct = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const deleteProduct = (productId: string) => {
    const isUsed = recipes.some(r => r.items.some(i => i.productId === productId));
    if (isUsed) {
        alert("Bu mahsulot retseptda ishlatilganligi sababli o'chirib bo'lmaydi.");
        return;
    }
    setProducts(prev => prev.filter(p => p.id !== productId));
  };

  const getProduct = (productId: string) => products.find(p => p.id === productId);

  return { products, setProducts, addProduct, updateProduct, deleteProduct, getProduct };
};
