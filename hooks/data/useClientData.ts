import { useState } from 'react';
import { Client, SalesInvoice, ClientPayment, DocumentStatus, SalesInvoiceItem } from '../../types';

interface useClientDataProps {
    initialClients: Client[];
    salesInvoices: SalesInvoice[];
    clientPayments: ClientPayment[];
    getClientInvoiceTotal: (items: SalesInvoiceItem[]) => number;
}

export const useClientData = ({ initialClients, salesInvoices, clientPayments, getClientInvoiceTotal }: useClientDataProps) => {
    const [clients, setClients] = useState<Client[]>(initialClients);

    const addClient = (client: Omit<Client, 'id'>): Client => {
        const newClient = { ...client, id: `c${Date.now()}` };
        setClients(prev => [newClient, ...prev]);
        return newClient;
    };
    const updateClient = (updatedClient: Client) => setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
    
    const canDeleteClient = (clientId: string): boolean => {
        const client = clients.find(c => c.id === clientId);
        if (!client) return true;
        if (Math.abs(client.initial_balance) > 0.01) return false;
        if (salesInvoices.some(inv => inv.client_id === clientId)) return false;
        if (clientPayments.some(p => p.client_id === clientId)) return false;
        return true;
    };

    const deleteClient = (clientId: string) => {
        if (!canDeleteClient(clientId)) {
            alert("Bu mijoz bilan bog'liq moliyaviy operatsiyalar mavjudligi sababli o'chirib bo'lmaydi.");
            return;
        }
        setClients(prev => prev.filter(c => c.id !== clientId));
    };

    const getClientBalance = (clientId: string) => {
        const client = clients.find(c => c.id === clientId);
        if (!client) return 0;

        const totalInvoices = salesInvoices.reduce((sum, note) => {
            if (note.client_id === clientId && note.status === DocumentStatus.CONFIRMED) {
                return sum + getClientInvoiceTotal(note.items);
            }
            return sum;
        }, 0);

        const totalPayments = clientPayments.reduce((sum, payment) => {
            if (payment.client_id === clientId) {
                return sum + payment.amount;
            }
            return sum;
        }, 0);

        return client.initial_balance + totalInvoices - totalPayments;
    };

    return { clients, setClients, addClient, updateClient, deleteClient, canDeleteClient, getClientBalance };
};
