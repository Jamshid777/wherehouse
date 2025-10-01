import { useState } from 'react';
import { Warehouse } from '../../types';

export const useWarehouseData = (initialWarehouses: Warehouse[]) => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>(initialWarehouses);

  const addWarehouse = (warehouse: Omit<Warehouse, 'id'>): Warehouse => {
    const newWarehouse = { ...warehouse, id: `w${Date.now()}` };
    setWarehouses(prev => [newWarehouse, ...prev]);
    return newWarehouse;
  };
  const updateWarehouse = (updatedWarehouse: Warehouse) => setWarehouses(prev => prev.map(w => w.id === updatedWarehouse.id ? updatedWarehouse : w));
  const deleteWarehouse = (warehouseId: string) => setWarehouses(prev => prev.filter(w => w.id !== warehouseId));

  return { warehouses, setWarehouses, addWarehouse, updateWarehouse, deleteWarehouse };
};
