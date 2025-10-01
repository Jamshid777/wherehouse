import React, { useState, useMemo } from 'react';
import { SalesReturnNote, DocumentStatus } from '../types';
import { UseMockDataReturnType } from '../hooks/useMockData';
import { PlusIcon } from './icons/PlusIcon';
import { EditIcon } from './icons/EditIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { SalesReturnFormModal } from './forms/SalesReturnFormModal';
import { ConfirmationModal } from './ConfirmationModal';

interface SalesReturnsViewProps {
  dataManager: UseMockDataReturnType;
  defaultWarehouseId: string | null;
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('uz-UZ').format(amount);
const formatDate = (date: Date) => date.toISOString().split('T')[0];

export const SalesReturnsView: React.FC<SalesReturnsViewProps> = ({ dataManager, defaultWarehouseId }) => {
  const { 
      salesReturns, clients, warehouses, dishes, 
      addSalesReturn, updateSalesReturn, deleteSalesReturn, confirmSalesReturn, 
  } = dataManager;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<SalesReturnNote | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [noteToConfirm, setNoteToConfirm] = useState<string | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    dateFrom: formatDate(new Date(new Date().setDate(new Date().getDate() - 30))),
    dateTo: formatDate(new Date()),
  });

  const getNoteTotal = (items: SalesReturnNote['items']) => items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const filteredNotes = useMemo(() => {
    const dateFrom = new Date(filters.dateFrom);
    dateFrom.setHours(0, 0, 0, 0);
    const dateTo = new Date(filters.dateTo);
    dateTo.setHours(23, 59, 59, 999);
    
    return salesReturns.filter(note => {
      const noteDate = new Date(note.date);
      return noteDate >= dateFrom && noteDate <= dateTo;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [salesReturns, filters]);

  const handleOpenModal = (note: SalesReturnNote | null = null) => {
    setEditingNote(note);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingNote(null);
  };

  const handleSave = (data: Omit<SalesReturnNote, 'id' | 'status' | 'doc_number'>) => {
    try {
        if (editingNote) {
            updateSalesReturn({ ...data, id: editingNote.id, doc_number: editingNote.doc_number, status: editingNote.status });
        } else {
            addSalesReturn(data);
        }
    } catch (error: any) {
        alert(`Xatolik: ${error.message}`);
    }
    handleCloseModal();
  };

  const handleConfirmClick = (id: string) => setNoteToConfirm(id);
  const handleDeleteClick = (id: string) => setNoteToDelete(id);
  const handleToggleExpand = (id: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  };

  const handleConfirm = () => {
    if (!noteToConfirm) return;
    try {
        confirmSalesReturn(noteToConfirm);
    } catch (error: any) {
        alert(`Xatolik: ${error.message}`);
    }
    setNoteToConfirm(null);
  }

  const handleConfirmDelete = () => {
    if (noteToDelete) {
      deleteSalesReturn(noteToDelete);
      setNoteToDelete(null);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Sotuvdan Qaytarish Hujjatlari</h2>
        <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2.5 rounded-lg shadow">
          <PlusIcon className="h-5 w-5" />
          <span>Yangi Qaytarish</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 tracking-wider">
            <tr>
              <th className="px-2 py-3 w-8 border-r"></th>
              <th className="px-6 py-3 border-r">Raqam / Sana</th>
              <th className="px-6 py-3 border-r">Mijoz</th>
              <th className="px-6 py-3 border-r">Ombor</th>
              <th className="px-6 py-3 border-r">Sababi</th>
              <th className="px-6 py-3 text-right border-r">Jami Summa</th>
              <th className="px-6 py-3 border-r">Hujjat Holati</th>
              <th className="px-6 py-3 text-center">Amallar</th>
            </tr>
          </thead>
          <tbody>
            {filteredNotes.map(note => {
              const total = getNoteTotal(note.items);
              const isExpanded = expandedRows.has(note.id);
              const clientName = clients.find(c => c.id === note.client_id)?.name || 'Noma\'lum';
              return (
              <React.Fragment key={note.id}>
                <tr onClick={() => handleToggleExpand(note.id)} className={`${isExpanded ? 'bg-amber-50' : 'hover:bg-slate-50'} cursor-pointer border-b`}>
                  <td className="px-2 py-4 text-center border-r"><ChevronDownIcon className={`h-5 w-5 text-slate-400 transition-transform ${isExpanded ? '' : '-rotate-90'}`} /></td>
                  <td className="px-6 py-4 border-r"><div className="font-medium">{note.doc_number}</div><div className="text-xs text-slate-500">{new Date(note.date).toLocaleDateString()}</div></td>
                  <td className="px-6 py-4 border-r">{clientName}</td>
                  <td className="px-6 py-4 border-r">{warehouses.find(w => w.id === note.warehouse_id)?.name || 'Noma\'lum'}</td>
                  <td className="px-6 py-4 border-r font-medium">{note.reason}</td>
                  <td className="px-6 py-4 text-right font-mono border-r">{formatCurrency(total)}</td>
                  <td className="px-6 py-4 border-r"><span className={`px-2 py-1 text-xs font-medium rounded-full ${note.status === DocumentStatus.CONFIRMED ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{note.status === DocumentStatus.CONFIRMED ? 'Tasdiqlangan' : 'Qoralama'}</span></td>
                  <td className="px-6 py-4 text-center">
                    {note.status === DocumentStatus.DRAFT ? (
                      <div className="flex justify-center items-center gap-2">
                        <button onClick={(e) => { e.stopPropagation(); handleOpenModal(note); }} title="Tahrirlash" className="p-2 rounded-full text-amber-600 hover:bg-amber-100"><EditIcon className="h-5 w-5"/></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(note.id); }} title="O'chirish" className="p-2 rounded-full text-red-600 hover:bg-red-100"><TrashIcon className="h-5 w-5"/></button>
                        <button onClick={(e) => { e.stopPropagation(); handleConfirmClick(note.id); }} className="px-3 py-1.5 bg-green-500 text-white text-xs font-semibold rounded-md hover:bg-green-600">Tasdiqlash</button>
                      </div>
                    ) : (<span>-</span>)}
                  </td>
                </tr>
                <tr>
                  <td colSpan={8} className="p-0 border-0">
                    <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                      <div className="overflow-hidden"><div className="p-4 bg-amber-50">
                        <h4 className="text-sm font-semibold text-slate-700 mb-2">Hujjat tarkibi</h4>
                        <table className="w-full text-xs bg-white rounded">
                          <thead><tr className="border-b"><th className="p-2 text-left">Tayyor mahsulot</th><th className="p-2 text-right">Miqdor</th><th className="p-2 text-right">Narx</th><th className="p-2 text-right">Summa</th></tr></thead>
                          <tbody>{note.items.map((item, index) => <tr key={index} className="border-b last:border-b-0"><td className="p-2">{dishes.find(d => d.id === item.dishId)?.name || 'Noma\'lum'}</td><td className="p-2 text-right font-mono">{item.quantity}</td><td className="p-2 text-right font-mono">{formatCurrency(item.price)}</td><td className="p-2 text-right font-mono">{formatCurrency(item.price * item.quantity)}</td></tr>)}</tbody>
                        </table>
                      </div></div>
                    </div>
                  </td>
                </tr>
              </React.Fragment>
            )})}
            {filteredNotes.length === 0 && (<tr><td colSpan={8} className="text-center py-10 text-slate-500">Sotuvdan qaytarish hujjatlari topilmadi.</td></tr>)}
          </tbody>
        </table>
      </div>
      
      <SalesReturnFormModal isOpen={isModalOpen} onClose={handleCloseModal} onSubmit={handleSave} note={editingNote} dataManager={dataManager} defaultWarehouseId={defaultWarehouseId} />
      <ConfirmationModal isOpen={!!noteToConfirm} onClose={() => setNoteToConfirm(null)} onConfirm={handleConfirm} title="Hujjatni tasdiqlash" message={<>Sotuvdan qaytarish hujjati tasdiqlanadi. Mijoz balansi va ombor qoldig'i yangilanadi. Davom etasizmi?</>} confirmButtonText="Ha, tasdiqlash" />
      <ConfirmationModal isOpen={!!noteToDelete} onClose={() => setNoteToDelete(null)} onConfirm={handleConfirmDelete} title="Hujjatni o'chirish" message="Haqiqatan ham ushbu qoralama hujjatni o'chirmoqchimisiz?" confirmButtonText="Ha, o'chirish" />
    </div>
  );
};
