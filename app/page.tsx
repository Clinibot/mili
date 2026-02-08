"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Plus, Trash2 } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import ConfirmationModal from '@/components/ConfirmationModal';

interface Client {
  id: string;
  name: string;
  contact_name: string;
  contact_email: string;
  phone_ia: string;
  workspace_name: string;
  status: string;
}

const STATUSES = [
  'Cliente',
  'Recogiendo briefing',
  'Implementando agente',
  'Entregado',
  'Testeo',
  'Mantenimiento mensual'
];

const COLUMN_GRADIENTS: Record<string, string> = {
  'Cliente': 'from-blue-50/30 to-transparent',
  'Recogiendo briefing': 'from-blue-100/30 to-purple-50/20',
  'Implementando agente': 'from-purple-50/30 to-blue-50/20',
  'Entregado': 'from-blue-50/30 to-purple-100/30',
  'Testeo': 'from-purple-100/30 to-blue-50/20',
  'Mantenimiento mensual': 'from-purple-50/30 to-transparent'
};

export default function Home() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);

  const handleDeleteClick = (e: React.MouseEvent, clientId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setClientToDelete(clientId);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!clientToDelete) return;

    try {
      const { error } = await supabase.from('clients').delete().eq('id', clientToDelete);
      if (error) throw error;

      setClients(clients.filter(c => c.id !== clientToDelete));
      toast.success('Cliente eliminado correctamente');
    } catch (err) {
      toast.error('Error eliminando cliente');
      console.error(err);
    }
  };

  useEffect(() => {
    async function fetchClients() {
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('id, name, contact_name, contact_email, phone_ia, workspace_name, status')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching clients:', error);
          setClients([]);
        } else {
          setClients(data || []);
        }
      } catch (err) {
        console.error("Supabase client error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchClients();
  }, []);

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.contact_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group clients by status
  const clientsByStatus = STATUSES.reduce((acc, status) => {
    acc[status] = filteredClients.filter(c => (c.status || 'Cliente') === status);
    return acc;
  }, {} as Record<string, Client[]>);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar clientes..."
              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Link href="/clients/new">
            <button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-blue-500/20 transition-all active:scale-95 group">
              <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
              <span>Nuevo Cliente</span>
            </button>
          </Link>
        </div>

        {/* Pipeline View */}
        {loading ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {STATUSES.map((status) => (
              <div key={status} className="min-w-[280px] space-y-3">
                <div className="h-8 bg-slate-100 rounded-lg animate-pulse"></div>
                <div className="h-32 bg-slate-100 rounded-2xl animate-pulse"></div>
                <div className="h-32 bg-slate-100 rounded-2xl animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {STATUSES.map((status) => (
              <PipelineColumn
                key={status}
                title={status}
                gradient={COLUMN_GRADIENTS[status]}
                clients={clientsByStatus[status]}
                onDeleteClick={handleDeleteClick}
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Eliminar Cliente"
        message="¿Estás seguro de que quieres eliminar este cliente? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        destructive
      />
    </DashboardLayout>
  );
}

function PipelineColumn({
  title,
  gradient,
  clients,
  onDeleteClick
}: {
  title: string;
  gradient: string;
  clients: Client[];
  onDeleteClick: (e: React.MouseEvent, id: string) => void;
}) {
  return (
    <div className={`min-w-[280px] flex flex-col bg-gradient-to-b ${gradient} rounded-2xl p-4 h-[calc(100vh-280px)]`}>
      {/* Column Header */}
      <div className="pb-4 mb-4 border-b border-slate-200/50">
        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">{title}</h3>
        <p className="text-xs text-slate-500 mt-1">{clients.length} cliente{clients.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Clients List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
        {clients.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            Sin clientes
          </div>
        ) : (
          clients.map((client) => (
            <ClientCard key={client.id} client={client} onDeleteClick={onDeleteClick} />
          ))
        )}
      </div>
    </div>
  );
}

function ClientCard({
  client,
  onDeleteClick
}: {
  client: Client;
  onDeleteClick: (e: React.MouseEvent, id: string) => void;
}) {
  return (
    <Link href={`/clients/${client.id}`}>
      <Card className="bg-white border border-slate-100/50 hover:border-transparent hover:shadow-lg hover:shadow-blue-500/10 rounded-2xl p-5 transition-all duration-300 group relative overflow-hidden">
        {/* Subtle gradient on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 via-purple-50/0 to-blue-50/0 group-hover:from-blue-50/30 group-hover:via-purple-50/20 group-hover:to-blue-50/30 transition-all duration-500 pointer-events-none"></div>

        <div className="relative z-10">
          {/* Header with delete button */}
          <div className="flex justify-between items-start mb-3">
            <h4 className="font-bold text-slate-800 text-base leading-tight pr-2 group-hover:text-blue-600 transition-colors">
              {client.name}
            </h4>
            <button
              onClick={(e) => onDeleteClick(e, client.id)}
              className="text-slate-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50/80 transition-all flex-shrink-0"
              title="Eliminar Cliente"
            >
              <Trash2 size={16} />
            </button>
          </div>

          {/* Contact Info */}
          <div className="space-y-1.5 text-sm">
            {client.contact_name && (
              <p className="text-slate-600 truncate">{client.contact_name}</p>
            )}
            {client.contact_email && (
              <p className="text-slate-500 text-xs truncate">{client.contact_email}</p>
            )}
            {client.phone_ia && (
              <p className="text-slate-500 text-xs truncate">{client.phone_ia}</p>
            )}
          </div>

          {/* Workspace Badge */}
          {client.workspace_name && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <span className="inline-block px-2.5 py-1 bg-slate-50 text-slate-600 text-xs rounded-lg">
                {client.workspace_name}
              </span>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
