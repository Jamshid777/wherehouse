
import React, { useState, useMemo } from 'react';
import { Product, Unit } from '../types';
import { UseMockDataReturnType } from '../hooks/useMockData';
import { Modal } from './Modal';
import { PlusIcon } from './icons/PlusIcon';
import { EditIcon } from './icons/EditIcon';
import { TrashIcon } from './icons/TrashIcon';
import { SearchIcon } from './icons/SearchIcon';

interface ProductsViewProps {
  dataManager: UseMockDataReturnType;
}

export const ProductsView: React.FC<ProductsViewProps> = ({ dataManager }) => {
  const { products, addProduct, updateProduct, deleteProduct } = dataManager;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = useMemo(() => {
    return products.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

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
  
  const handleDelete = (id: string) => {
    if (window.confirm("Haqiqatan ham bu mahsulotni o'chirmoqchimisiz?")) {
        deleteProduct(id);
    }
  }

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
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2.5 rounded-lg hover:bg-blue-600 transition-colors shadow"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Qo'shish</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 tracking-wider">
            <tr>
              <th scope="col" className="px-6 py-3">Nomi</th>
              <th scope="col" className="px-6 py-3">SKU</th>
              <th scope="col" className="px-6 py-3">Kategoriya</th>
              <th scope="col" className="px-6 py-3">O'lchov birligi</th>
              <th scope="col" className="px-6 py-3 text-right">Minimal zaxira</th>
              <th scope="col" className="px-6 py-3 text-center">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredProducts.map(product => (
              <tr key={product.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{product.name}</td>
                <td className="px-6 py-4 text-slate-600">{product.sku}</td>
                <td className="px-6 py-4 text-slate-600">{product.category}</td>
                <td className="px-6 py-4 text-slate-600">{product.unit}</td>
                <td className="px-6 py-4 text-slate-600 text-right font-mono">{product.min_stock}</td>
                <td className="px-6 py-4 text-center">
                  <div className="flex justify-center items-center gap-2">
                    <button onClick={() => handleOpenModal(product)} className="p-2 rounded-full text-blue-600 hover:bg-blue-50 transition-colors"><EditIcon className="h-5 w-5"/></button>
                    <button onClick={() => handleDelete(product.id)} className="p-2 rounded-full text-red-600 hover:bg-red-50 transition-colors"><TrashIcon className="h-5 w-5"/></button>
                  </div>
                </td>
              </tr>
            ))}
             {filteredProducts.length === 0 && (
                <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-500">
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
    </div>
  );
};

interface ProductFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Omit<Product, 'id'> | Product) => void;
    product: Product | null;
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({isOpen, onClose, onSubmit, product}) => {
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        category: '',
        unit: Unit.KG,
        min_stock: 0,
    });

    React.useEffect(() => {
        if(product){
            setFormData({
                name: product.name,
                sku: product.sku,
                category: product.category,
                unit: product.unit,
                min_stock: product.min_stock,
            });
        } else {
            setFormData({
                name: '', sku: '', category: '', unit: Unit.KG, min_stock: 0,
            });
        }
    }, [product, isOpen]);

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
        <Modal isOpen={isOpen} onClose={onClose} title={product ? "Mahsulotni tahrirlash" : "Yangi mahsulot qo'shish"}>
            <form onSubmit={handleFormSubmit} className="space-y-4">
                 <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Mahsulot nomi</label>
                    <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500" />
                </div>
                 <div>
                    <label htmlFor="sku" className="block text-sm font-medium text-slate-700 mb-1">SKU (Artikul)</label>
                    <input type="text" name="sku" id="sku" value={formData.sku} onChange={handleChange} required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500" />
                </div>
                 <div>
                    <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1">Kategoriya</label>
                    <input type="text" name="category" id="category" value={formData.category} onChange={handleChange} required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500" />
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="unit" className="block text-sm font-medium text-slate-700 mb-1">O'lchov birligi</label>
                        <select name="unit" id="unit" value={formData.unit} onChange={handleChange} required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500">
                            {Object.values(Unit).map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="min_stock" className="block text-sm font-medium text-slate-700 mb-1">Minimal zaxira</label>
                        <input type="number" name="min_stock" id="min_stock" value={formData.min_stock} onChange={handleChange} required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500" />
                    </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200">Bekor qilish</button>
                    <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">Saqlash</button>
                </div>
            </form>
        </Modal>
    );
}
