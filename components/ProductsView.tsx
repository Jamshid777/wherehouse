

import React, { useState, useMemo } from 'react';
import { Product, Unit, DocumentStatus } from '../types';
import { UseMockDataReturnType } from '../hooks/useMockData';
import { PlusIcon } from './icons/PlusIcon';
import { SearchIcon } from './icons/SearchIcon';
import { ProductFormModal } from './forms/ProductFormModal';
import { ConfirmationModal } from './ConfirmationModal';

interface ProductsViewProps {
  dataManager: UseMockDataReturnType;
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('uz-UZ').format(amount);

export const ProductsView: React.FC<ProductsViewProps> = ({ dataManager }) => {
  const { products, addProduct, updateProduct, deleteProduct, goodsReceipts, suppliers } = dataManager;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    return products.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a,b) => a.name.localeCompare(b.name));
  }, [products, searchTerm]);

  const supplierPricesByProduct = useMemo(() => {
    // Cache for product -> list of suppliers with their latest price.
    // The list will be implicitly sorted by recency due to the processing order.
    const productSuppliersCache = new Map<string, { supplierId: string, price: number }[]>();

    // Get confirmed receipts and sort them by date descending (most recent first).
    const confirmedReceipts = goodsReceipts
        .filter(note => note.status === DocumentStatus.CONFIRMED && note.supplier_id !== 'SYSTEM')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    for (const note of confirmedReceipts) {
        for (const item of note.items) {
            // Get or create the list of suppliers for the current product.
            if (!productSuppliersCache.has(item.productId)) {
                productSuppliersCache.set(item.productId, []);
            }
            const suppliersForProduct = productSuppliersCache.get(item.productId)!;

            // If we have less than 5 suppliers AND this supplier isn't already in the list, add them.
            // Because receipts are sorted by date descending, the first time we encounter a supplier for a product,
            // it's from their most recent transaction with that product.
            if (suppliersForProduct.length < 5 && !suppliersForProduct.some(s => s.supplierId === note.supplier_id)) {
                suppliersForProduct.push({
                    supplierId: note.supplier_id,
                    price: item.price,
                });
            }
        }
    }

    // Now, format the cached data for display.
    const formattedPrices = new Map<string, string>();
    for (const [productId, suppliersList] of productSuppliersCache.entries()) {
        const priceEntries = suppliersList.map(({ supplierId, price }) => {
            const supplier = suppliers.find(s => s.id === supplierId);
            return {
                name: supplier?.name || 'Noma\'lum',
                price: price,
            };
        });
        
        // The list is already sorted by recency and limited to 5.
        formattedPrices.set(productId, priceEntries.map(entry => `${entry.name} (${formatCurrency(entry.price)} so'm)`).join(', '));
    }
    return formattedPrices;
  }, [goodsReceipts, suppliers]);

  const handleOpenModal = (product: Product | null = null) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSubmit = (formData: Omit<Product, 'id'> | Product) => {
    if ('id' in formData) {
      updateProduct(formData);
    } else {
      addProduct(formData);
    }
    handleCloseModal();
  };
  
  const handleDeleteClick = (id: string) => {
    setProductToDelete(id);
  }

  const handleConfirmDelete = () => {
    if (productToDelete) {
      deleteProduct(productToDelete);
      setProductToDelete(null);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Mahsulotlar Nomenklaturasi</h2>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
            />
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2.5 rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all shadow"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Qo'shish</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="text-xs text-slate-600 bg-slate-50 border-b-2 border-slate-200">
            <tr>
              <th scope="col" className="px-6 py-3 border-r border-slate-200">T/r</th>
              <th scope="col" className="px-6 py-3 border-r border-slate-200">Nomi</th>
              <th scope="col" className="px-6 py-3 border-r border-slate-200">O'lchov birligi</th>
              <th scope="col" className="px-6 py-3 border-r border-slate-200">Guruhi</th>
              <th scope="col" className="px-6 py-3 text-right border-r border-slate-200">Minimal zaxira</th>
              <th scope="col" className="px-6 py-3 border-r border-slate-200" style={{minWidth: '300px'}}>Yetkazib beruvchilar (Narxi)</th>
              <th scope="col" className="px-6 py-3 text-center">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredProducts.map((product, index) => (
              <tr key={product.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 text-slate-600 border-r border-slate-200">{index + 1}</td>
                <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap border-r border-slate-200">{product.name}</td>
                <td className="px-6 py-4 text-slate-600 border-r border-slate-200">{product.unit}</td>
                <td className="px-6 py-4 text-slate-600 border-r border-slate-200">{product.category}</td>
                <td className="px-6 py-4 text-slate-600 text-right font-mono border-r border-slate-200">{product.min_stock}</td>
                <td className="px-6 py-4 text-slate-600 border-r border-slate-200">
                    {supplierPricesByProduct.get(product.id) || <span className="text-slate-400">Ma'lumot yo'q</span>}
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex justify-center items-center gap-4">
                    <button onClick={(e) => { e.stopPropagation(); handleOpenModal(product); }} title="Tahrirlash" className="transition-transform hover:scale-125">
                        <span role="img" aria-label="Tahrirlash">✏️</span>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(product.id); }} title="O'chirish" className="transition-transform hover:scale-125">
                        <span role="img" aria-label="O'chirish">❌</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
             {filteredProducts.length === 0 && (
                <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-500">
                        Mahsulotlar topilmadi.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <ProductFormModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        product={editingProduct}
      />
      <ConfirmationModal
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Mahsulotni o'chirish"
        message="Haqiqatan ham bu mahsulotni o'chirmoqchimisiz? Bu amalni bekor qilib bo'lmaydi."
        confirmButtonText="Ha, o'chirish"
      />
    </div>
  );
};