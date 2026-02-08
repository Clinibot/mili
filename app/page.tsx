"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Plus, MoreHorizontal, Phone, Mail, User, Mic } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';

interface Client {
  id: string;
  name: string;
  contact_name: string;
  contact_email: string;
  phone_ia: string;
  workspace_name: string;
}

export default function Home() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchClients() {
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('id, name, contact_name, contact_email, phone_ia, workspace_name')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching clients:', error);
          // Mock data for UI development if Supabase connection fails/empty
          setClients([
            { id: '1', name: 'Clínica Dental Sonrisas', contact_name: 'Dr. Pérez', contact_email: 'dr.perez@example.com', phone_ia: '+34 912 345 678', workspace_name: 'clinica-sonrisas' },
            { id: '2', name: 'Abogados & Asociados', contact_name: 'María García', contact_email: 'maria@example.com', phone_ia: '+34 934 567 890', workspace_name: 'abogados-asoc' },
            { id: '3', name: 'Reformas Integrales', contact_name: 'Juan López', contact_email: 'juan@example.com', phone_ia: '+34 600 123 456', workspace_name: 'reformas-int' },
          ]);
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
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Link href="/clients/new">
            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-medium shadow-lg shadow-blue-500/20 transition-all active:scale-95">
              <Plus size={18} />
              <span>Nuevo Cliente</span>
            </button>
          </Link>
        </div>

        {/* Client Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading ? (
            // Skeleton Loader
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-64 rounded-xl bg-white/5 animate-pulse"></div>
            ))
          ) : filteredClients.map((client) => (
            <Link href={`/clients/${client.id}`} key={client.id} className="group">
              <Card className="h-full hover:bg-white/10 transition-all duration-300 border-white/5 hover:border-blue-500/30 group-hover:transform group-hover:-translate-y-1">
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-indigo-400 group-hover:text-white group-hover:from-indigo-500 group-hover:to-purple-500 transition-all duration-300">
                      <User size={24} />
                    </div>
                    <button className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all">
                      <MoreHorizontal size={20} />
                    </button>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white/90 group-hover:text-white truncate">{client.name}</h3>
                    <p className="text-sm text-slate-400 truncate">{client.contact_name}</p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Phone size={14} className="text-blue-400" />
                      <span className="truncate">{client.phone_ia || 'Sin asignar'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Mail size={14} className="text-purple-400" />
                      <span className="truncate">{client.contact_email || 'sincorreo@...'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Mic size={14} className="text-emerald-400" />
                      <span className="truncate">{client.workspace_name || 'Workflow 1'}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
