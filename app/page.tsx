"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Plus, Trash2, LayoutGrid, Kanban, User, Phone, Mail, Mic } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import ConfirmationModal from '@/components/ConfirmationModal';
import { logAdminAction } from '@/lib/logger';
import { DndContext, DragEndEvent, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [activeId, setActiveId] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'pipeline' | 'grid'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('clientsViewMode') as 'pipeline' | 'grid') || 'pipeline';
    }
    return 'pipeline';
  });

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    localStorage.setItem('clientsViewMode', viewMode);
  }, [viewMode]);

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

      logAdminAction('Eliminar Cliente', `Se ha eliminado el cliente (ID: ${clientToDelete})`);
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

  const handleDragStart = (event: DragEndEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const clientId = active.id as string;
    const newStatus = over.id as string;

    // Check if dropped on a valid status column
    if (!STATUSES.includes(newStatus)) return;

    const client = clients.find(c => c.id === clientId);
    if (!client || client.status === newStatus) return;

    // Optimistic update
    setClients(clients.map(c =>
      c.id === clientId ? { ...c, status: newStatus } : c
    ));

    // Update in database
    try {
      const { error } = await supabase
        .from('clients')
        .update({ status: newStatus })
        .eq('id', clientId);

      if (error) throw error;
      toast.success(`Cliente movido a "${newStatus}"`);
    } catch (err) {
      console.error('Error updating client status:', err);
      toast.error('Error actualizando estado');
      // Revert on error
      setClients(clients);
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.contact_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group clients by status
  const clientsByStatus = STATUSES.reduce((acc, status) => {
    acc[status] = filteredClients.filter(c => (c.status || 'Cliente') === status);
    return acc;
  }, {} as Record<string, Client[]>);

  const activeClient = activeId ? clients.find(c => c.id === activeId) : null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Buscar clientes..."
                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* View Toggle */}
            <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-600'
                  }`}
                title="Vista Grid"
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setViewMode('pipeline')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'pipeline'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-600'
                  }`}
                title="Vista Pipeline"
              >
                <Kanban size={18} />
              </button>
            </div>
          </div>

          <Link href="/clients/new">
            <button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-blue-500/20 transition-all active:scale-95 group">
              <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
              <span>Nuevo Cliente</span>
            </button>
          </Link>
        </div>

        {/* Conditional View Rendering */}
        {loading ? (
          <LoadingSkeleton viewMode={viewMode} />
        ) : viewMode === 'pipeline' ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 overflow-x-auto pb-4">
              {STATUSES.map((status) => (
                <PipelineColumn
                  key={status}
                  title={status}
                  gradient={COLUMN_GRADIENTS[status]}
                  clients={clientsByStatus[status]}
                  columnFilter={columnFilters[status] || ''}
                  onFilterChange={(value) => setColumnFilters({ ...columnFilters, [status]: value })}
                  onDeleteClick={handleDeleteClick}
                />
              ))}
            </div>
            <DragOverlay>
              {activeClient ? (
                <div className="opacity-80">
                  <ClientCard client={activeClient} onDeleteClick={() => { }} isDragging />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : (
          <GridView clients={filteredClients} onDeleteClick={handleDeleteClick} />
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

function LoadingSkeleton({ viewMode }: { viewMode: 'pipeline' | 'grid' }) {
  if (viewMode === 'pipeline') {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STATUSES.map((status) => (
          <div key={status} className="min-w-[280px] space-y-3">
            <div className="h-8 bg-slate-100 rounded-lg animate-pulse"></div>
            <div className="h-32 bg-slate-100 rounded-2xl animate-pulse"></div>
            <div className="h-32 bg-slate-100 rounded-2xl animate-pulse"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-64 rounded-3xl bg-slate-100 animate-pulse"></div>
      ))}
    </div>
  );
}

function PipelineColumn({
  title,
  gradient,
  clients,
  columnFilter,
  onFilterChange,
  onDeleteClick
}: {
  title: string;
  gradient: string;
  clients: Client[];
  columnFilter: string;
  onFilterChange: (value: string) => void;
  onDeleteClick: (e: React.MouseEvent, id: string) => void;
}) {
  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(columnFilter.toLowerCase()) ||
    c.contact_name?.toLowerCase().includes(columnFilter.toLowerCase())
  );

  // Make this column a droppable zone
  const { setNodeRef } = useDroppable({
    id: title,
  });

  return (
    <SortableContext
      id={title}
      items={filteredClients.map(c => c.id)}
      strategy={verticalListSortingStrategy}
    >
      <div
        ref={setNodeRef}
        className={`min-w-[280px] flex flex-col bg-gradient-to-b ${gradient} rounded-2xl p-4 h-[calc(100vh-280px)]`}
        id={title}
      >
        {/* Column Header */}
        <div className="pb-3 mb-3 border-b border-slate-200/50 space-y-2">
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">{title}</h3>

          {/* Column Filter */}
          <input
            type="text"
            placeholder="Filtrar..."
            value={columnFilter}
            onChange={(e) => onFilterChange(e.target.value)}
            className="w-full text-xs bg-white/50 border border-slate-200/50 rounded-lg px-2 py-1.5 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 transition-all"
          />

          <p className="text-xs text-slate-500">
            {columnFilter ? `${filteredClients.length} de ${clients.length}` : `${clients.length} cliente${clients.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Clients List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
          {filteredClients.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              {columnFilter ? 'Sin resultados' : 'Sin clientes'}
            </div>
          ) : (
            filteredClients.map((client) => (
              <DraggableClientCard
                key={client.id}
                client={client}
                onDeleteClick={onDeleteClick}
              />
            ))
          )}
        </div>
      </div>
    </SortableContext>
  );
}

function DraggableClientCard({
  client,
  onDeleteClick
}: {
  client: Client;
  onDeleteClick: (e: React.MouseEvent, id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: client.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ClientCard client={client} onDeleteClick={onDeleteClick} isDragging={isDragging} />
    </div>
  );
}

function ClientCard({
  client,
  onDeleteClick,
  isDragging
}: {
  client: Client;
  onDeleteClick: (e: React.MouseEvent, id: string) => void;
  isDragging?: boolean;
}) {
  return (
    <Link href={`/clients/${client.id}`}>
      <Card className={`bg-white border border-slate-100/50 hover:border-transparent hover:shadow-lg hover:shadow-blue-500/10 rounded-2xl p-5 transition-all duration-300 group relative overflow-hidden ${isDragging ? 'cursor-grabbing scale-105' : 'cursor-grab'}`}>
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

function GridView({
  clients,
  onDeleteClick
}: {
  clients: Client[];
  onDeleteClick: (e: React.MouseEvent, id: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {clients.map((client) => (
        <Link href={`/clients/${client.id}`} key={client.id} className="group">
          <Card className="h-full bg-white hover:shadow-[0_20px_50px_rgba(59,130,246,0.12)] hover:-translate-y-2 transition-all duration-500 border-slate-100 shadow-sm rounded-[32px] group-hover:border-blue-200 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50/50 to-transparent rounded-bl-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
            <div className="p-8 space-y-6 relative z-10">
              <div className="flex justify-between items-start">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center text-blue-600 group-hover:from-blue-600 group-hover:to-indigo-600 group-hover:text-white transition-all duration-500 shadow-inner">
                  <User size={28} />
                </div>
                <button
                  onClick={(e) => onDeleteClick(e, client.id)}
                  className="text-slate-300 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-all opacity-100"
                  title="Eliminar Cliente"
                >
                  <Trash2 size={20} />
                </button>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">{client.name}</h3>
                <p className="text-sm text-slate-500 truncate">{client.contact_name}</p>
              </div>

              <div className="space-y-2.5 pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2.5 text-sm text-slate-500">
                  <Phone size={14} className="text-blue-500" />
                  <span className="truncate">{client.phone_ia || 'Sin asignar'}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-slate-500">
                  <Mail size={14} className="text-purple-500" />
                  <span className="truncate">{client.contact_email || 'sincorreo@...'}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-slate-500">
                  <Mic size={14} className="text-emerald-500" />
                  <span className="truncate">{client.workspace_name || 'Workflow 1'}</span>
                </div>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
