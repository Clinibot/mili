"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Plus, Trash2, LayoutGrid, Kanban, User, Phone, Mail, Mic, GripVertical } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import ConfirmationModal from '@/components/ConfirmationModal';
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
  'Cita programada',
  'Presupuesto enviado',
  'Intención de compra',
  'Cliente ganado',
  'Cliente perdido',
  'Recogiendo briefing',
  'Implementando agente',
  'Entregado',
  'Testeo',
  'Mantenimiento mensual'
];

const COLUMN_GRADIENTS: Record<string, string> = {
  // Mili (Pre-sales) - Unified Cool Tone
  'Cita programada': 'from-cyan-50 to-blue-50/50',
  'Presupuesto enviado': 'from-cyan-50 to-blue-50/50',
  'Intención de compra': 'from-cyan-50 to-blue-50/50',
  'Cliente ganado': 'from-cyan-50 to-blue-50/50',
  'Cliente perdido': 'from-cyan-50 to-blue-50/50',

  // Sonia (Post-sales) - Unified Warm Tone
  'Recogiendo briefing': 'from-orange-50 to-rose-50/50',
  'Implementando agente': 'from-orange-50 to-rose-50/50',
  'Entregado': 'from-orange-50 to-rose-50/50',
  'Testeo': 'from-orange-50 to-rose-50/50',
  'Mantenimiento mensual': 'from-orange-50 to-rose-50/50'
};

export default function HomePage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [userEmail, setUserEmail] = useState<string>('');
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
      toast.success('Cliente eliminado correctamente');
    } catch (err) {
      toast.error('Error eliminando cliente');
      console.error(err);
    } finally {
      setDeleteModalOpen(false);
      setClientToDelete(null);
    }
  };

  const fetchClients = async () => {
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
  };

  useEffect(() => {
    fetchUserEmail();
    fetchClients();
  }, []);

  const fetchUserEmail = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.email) setUserEmail(session.user.email);
  };

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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.3)]" size={18} />
              <input
                type="text"
                placeholder="Buscar clientes..."
                className="w-full bg-[#0E1219] border border-[#1F2937] rounded-xl py-2.5 pl-10 pr-4 text-[#E8ECF1] placeholder:text-[rgba(255,255,255,0.3)] focus:outline-none focus:ring-2 focus:ring-[#008DCB]/20 focus:border-[#008DCB] transition-all shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* View Toggle */}
            <div className="flex bg-[#0E1219] border border-[#1F2937] rounded-xl p-1 shadow-sm">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid'
                  ? 'bg-[#008DCB] text-[#070A0F] shadow-lg shadow-[#008DCB]/20'
                  : 'text-[rgba(255,255,255,0.3)] hover:text-[#E8ECF1] hover:bg-[#141A23]'
                  }`}
                title="Vista Grid"
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setViewMode('pipeline')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'pipeline'
                  ? 'bg-[#008DCB] text-[#070A0F] shadow-lg shadow-[#008DCB]/20'
                  : 'text-[rgba(255,255,255,0.3)] hover:text-[#E8ECF1] hover:bg-[#141A23]'
                  }`}
                title="Vista Pipeline"
              >
                <Kanban size={18} />
              </button>
            </div>
          </div>

          <Link href="/clients/new">
            <button className="flex items-center gap-2 bg-[#008DCB] hover:bg-[#008DCB]/90 text-[#070A0F] px-6 py-3 rounded-2xl font-bold shadow-xl shadow-[#008DCB]/20 transition-all active:scale-95 group">
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
            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
              {STATUSES.map((status) => (
                <>
                  {/* Visual Gap / Divider between Pre-sales (Mili) and Post-sales (Sonia) */}
                  {status === 'Recogiendo briefing' && (
                    <div className="flex flex-col justify-center items-center px-2 min-h-full">
                      <div className="h-full w-px bg-[#1F2937] my-4"></div>
                    </div>
                  )}

                  <PipelineColumn
                    key={status}
                    title={status}
                    gradient=""
                    clients={clientsByStatus[status]}
                    columnFilter={columnFilters[status] || ''}
                    onFilterChange={(value) => setColumnFilters({ ...columnFilters, [status]: value })}
                    onDeleteClick={handleDeleteClick}
                  />
                </>
              ))}
            </div>
            <DragOverlay>
              {activeClient ? (
                <div className="opacity-90">
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
            <div className="h-8 bg-[#141A23] rounded-lg animate-pulse"></div>
            <div className="h-32 bg-[#141A23] rounded-2xl animate-pulse"></div>
            <div className="h-32 bg-[#141A23] rounded-2xl animate-pulse"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-64 rounded-3xl bg-[#141A23] animate-pulse"></div>
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
        className={`min-w-[280px] flex flex-col bg-[#0E1219] border border-[#1F2937] rounded-2xl p-4 h-[calc(100vh-280px)]`}
        id={title}
      >
        {/* Column Header */}
        <div className="pb-3 mb-3 border-b border-[#1F2937] space-y-2">
          <h3 className="font-bold font-header text-[#008DCB] text-xs uppercase tracking-[0.2em]">{title}</h3>

          {/* Column Filter */}
          <input
            type="text"
            placeholder="Filtrar..."
            value={columnFilter}
            onChange={(e) => onFilterChange(e.target.value)}
            className="w-full text-xs bg-[#141A23] border border-[#1F2937] rounded-lg px-2 py-1.5 text-[#E8ECF1] placeholder:text-[rgba(255,255,255,0.3)] focus:outline-none focus:border-[#008DCB] transition-all"
          />

          <p className="text-[10px] font-mono text-[rgba(255,255,255,0.4)]">
            {columnFilter ? `${filteredClients.length} de ${clients.length}` : `${clients.length} cliente${clients.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Clients List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
          {filteredClients.length === 0 ? (
            <div className="text-center py-8 text-[rgba(255,255,255,0.2)] text-sm font-medium">
              {columnFilter ? 'Sin resultados' : 'Vacío'}
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
    <div ref={setNodeRef} style={style} {...attributes}>
      <ClientCard
        client={client}
        onDeleteClick={onDeleteClick}
        isDragging={isDragging}
        dragListeners={listeners}
      />
    </div>
  );
}

function ClientCard({
  client,
  onDeleteClick,
  isDragging,
  dragListeners
}: {
  client: Client;
  onDeleteClick: (e: React.MouseEvent, id: string) => void;
  isDragging?: boolean;
  dragListeners?: any;
}) {
  return (
    <Link href={`/clients/${client.id}`}>
      <Card className={`bg-[#141A23] border border-[#1F2937] hover:border-[#008DCB]/50 hover:shadow-xl hover:shadow-[#008DCB]/5 rounded-xl p-5 transition-all duration-300 group relative overflow-hidden ${isDragging ? 'cursor-grabbing scale-105 shadow-2xl z-50' : ''}`}>
        <div className="relative z-10">
          {/* Header with drag handle and delete button */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              {/* Drag Handle - only shown in pipeline view */}
              {dragListeners && (
                <div
                  {...dragListeners}
                  className="text-[rgba(255,255,255,0.2)] hover:text-[#E8ECF1] cursor-grab active:cursor-grabbing p-1 -ml-1 flex-shrink-0 touch-none transition-colors"
                  title="Arrastrar para mover"
                >
                  <GripVertical size={16} />
                </div>
              )}
              <h4 className="font-bold text-[#E8ECF1] text-sm leading-tight group-hover:text-[#008DCB] transition-colors truncate">
                {client.name}
              </h4>
            </div>
            <button
              onClick={(e) => onDeleteClick(e, client.id)}
              className="text-[rgba(255,255,255,0.2)] hover:text-[#F78E5E] p-1.5 rounded-lg hover:bg-[#F78E5E]/10 transition-all flex-shrink-0"
              title="Eliminar Cliente"
            >
              <Trash2 size={14} />
            </button>
          </div>

          {/* Contact Info */}
          <div className="space-y-1 text-xs">
            {client.contact_name && (
              <p className="text-[rgba(255,255,255,0.55)] truncate font-medium">{client.contact_name}</p>
            )}
            {client.contact_email && (
              <p className="text-[rgba(255,255,255,0.3)] truncate font-mono">{client.contact_email}</p>
            )}
            {client.phone_ia && (
              <p className="text-[rgba(255,255,255,0.3)] truncate font-mono">{client.phone_ia}</p>
            )}
          </div>

          {/* Workspace Badge */}
          {client.workspace_name && (
            <div className="mt-3 pt-3 border-t border-[#1F2937]">
              <span className="inline-block px-2 py-0.5 bg-[#070A0F] border border-[#1F2937] text-[rgba(255,255,255,0.4)] text-[10px] uppercase tracking-wider font-bold rounded-md">
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {clients.map((client) => (
        <Link href={`/clients/${client.id}`} key={client.id} className="group">
          <Card className="h-full bg-[#0E1219] hover:bg-[#141A23] hover:-translate-y-1 transition-all duration-300 border border-[#1F2937] hover:border-[#008DCB]/30 shadow-xl shadow-black/20 rounded-2xl overflow-hidden relative">
            <div className="p-6 space-y-6 relative z-10">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-xl bg-[#1F2937] flex items-center justify-center text-[#008DCB] group-hover:bg-[#008DCB] group-hover:text-[#070A0F] transition-all duration-300 shadow-inner">
                  <User size={24} />
                </div>
                <button
                  onClick={(e) => onDeleteClick(e, client.id)}
                  className="text-[rgba(255,255,255,0.2)] hover:text-[#F78E5E] p-2 rounded-lg hover:bg-[#F78E5E]/10 transition-all"
                  title="Eliminar Cliente"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#E8ECF1] group-hover:text-[#008DCB] transition-colors truncate">{client.name}</h3>
                <p className="text-sm text-[rgba(255,255,255,0.55)] truncate">{client.contact_name}</p>
              </div>

              <div className="space-y-2.5 pt-4 border-t border-[#1F2937]">
                <div className="flex items-center gap-2.5 text-xs text-[rgba(255,255,255,0.4)] font-mono">
                  <Phone size={12} className="text-[#008DCB]" />
                  <span className="truncate">{client.phone_ia || 'Sin asignar'}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-[rgba(255,255,255,0.4)] font-mono">
                  <Mail size={12} className="text-purple-400" />
                  <span className="truncate">{client.contact_email || 'sincorreo@...'}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-[rgba(255,255,255,0.4)] font-mono">
                  <Mic size={12} className="text-[#67B7AF]" />
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
