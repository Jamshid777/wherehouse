import React, { useState } from 'react';
import { Client } from '../types';
import { UseMockDataReturnType } from '../hooks/useMockData';
import { PlusIcon } from './icons/PlusIcon';
import { EditIcon } from './icons/EditIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ClientFormModal } from './forms/ClientFormModal';
import { ConfirmationModal } from './ConfirmationModal';

interface ClientsViewProps {
  dataManager: UseMockDataReturnType;
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('uz-UZ').format(amount);

export const ClientsView: React.FC<ClientsViewProps> = ({ dataManager }) => {
  const { clients, addClient, updateClient, deleteClient, getClientBalance, canDeleteClient } = dataManager;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);

  const handleOpenModal = (client: Client | null = null) => {
    setEditingClient(client);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
  };

  const handleSubmit = (formData: Omit<Client, 'id'> | Client) => {
    if ('id' in formData) {
      updateClient(formData);
    } else {
      addClient(formData);
    }
    handleCloseModal();
  };
  
  const handleDeleteClick = (id: string) => {
    setClientToDelete(id);
  };

  const handleConfirmDelete = () => {
    if (clientToDelete) {
      deleteClient(clientToDelete);
      setClientToDelete(null);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Mijozlar</h2>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2.5 rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all shadow"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Yangi qo'shish</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 tracking-wider">
            <tr>
              <th scope="col" className="px-6 py-3 border-r border-slate-200">Nomi</th>
              <th scope="col" className="px-6 py-3 border-r border-slate-200">Telefon</th>
              <th scope="col" className="px-6 py-3 text-right border-r border-slate-200">Joriy Balans</th>
              <th scope="col" className="px-6 py-3 text-center">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {clients.map(client => {
                const balance = getClientBalance(client.id);
                const isDeletable = canDeleteClient(client.id);

                return (
                    <tr key={client.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap border-r border-slate-200">{client.name}</td>
                        <td className="px-6 py-4 text-slate-600 border-r border-slate-200">{client.phone || '-'}</td>
                        <td className="px-6 py-4 text-right border-r border-slate-200">
                            <div className={`font-mono font-semibold ${balance > 0 ? 'text-green-600' : balance < 0 ? 'text-red-600' : 'text-slate-800'}`}>
                                {formatCurrency(balance)}
                            </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center items-center gap-2">
                             <button onClick={() => handleOpenModal(client)} className="p-2 rounded-full text-amber-600 hover:bg-amber-50 transition-colors"><EditIcon className="h-5 w-5"/></button>
                            <button 
                              onClick={() => handleDeleteClick(client.id)} 
                              disabled={!isDeletable}
                              title={!isDeletable ? "Bu mijoz bilan bog'liq moliyaviy operatsiyalar mavjudligi sababli o'chirib bo'lmaydi." : "O'chirish"}
                              className="p-2 rounded-full text-red-600 hover:bg-red-50 transition-colors disabled:text-slate-400 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                            >
                                <TrashIcon className="h-5 w-5"/>
                            </button>
                          </div>
                        </td>
                    </tr>
                );
            })}
             {clients.length === 0 && (
                <tr>
                    <td colSpan={4} className="text-center py-10 text-slate-500">
                        Mijozlar mavjud emas.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      <ClientFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        client={editingClient}
      />
      <ConfirmationModal
        isOpen={!!clientToDelete}
        onClose={() => setClientToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Mijozni o'chirish"
        message="Haqiqatan ham bu mijozni o'chirmoqchimisiz?"
        confirmButtonText="Ha, o'chirish"
      />
    </div>
  );
};
