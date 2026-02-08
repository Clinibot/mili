"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Plus, Trash2, Phone, Mail, User, Mic } from 'lucide-react';
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
            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-blue-600/20 transition-all active:scale-95">
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
              <div key={i} className="h-64 rounded-2xl bg-slate-100 animate-pulse"></div>
            ))
          ) : filteredClients.map((client) => (
            <Link href={`/clients/${client.id}`} key={client.id} className="group">
              <Card className="h-full bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-slate-100 shadow-sm rounded-2xl group-hover:border-blue-100">
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm">
                      <User size={24} />
                    </div>
                    <button
                      onClick={async (e) => {
                        e.preventDefault(); // Prevent navigation
                        if (confirm('¿Estás seguro de querer eliminar este cliente?')) {
                          try {
                            const { error } = await supabase.from('clients').delete().eq('id', client.id);
                            if (error) throw error;
                            setClients(clients.filter(c => c.id !== client.id));
                          } catch (err) {
                            alert('Error eliminando cliente');
                            console.error(err);
                          }
                        }
                      }}
                      className="text-slate-300 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-all"
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
      </div>
    </DashboardLayout>
  );
}
