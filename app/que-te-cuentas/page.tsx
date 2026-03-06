"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import DashboardLayout from '@/components/DashboardLayout';
import { Plus, Trash2, Edit2, Check, X, Bookmark, LifeBuoy, Zap, Coffee, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Note {
    id: string;
    title: string;
    content: string;
    color: string;
    created_at: string;
}

const COLORS = [
    { name: 'Amarillo', value: 'from-amber-100 to-amber-200', border: 'border-amber-300', text: 'text-amber-900', shadow: 'shadow-amber-900/10' },
    { name: 'Azul', value: 'from-sky-100 to-sky-200', border: 'border-sky-300', text: 'text-sky-900', shadow: 'shadow-sky-900/10' },
    { name: 'Rosa', value: 'from-rose-100 to-rose-200', border: 'border-rose-300', text: 'text-rose-900', shadow: 'shadow-rose-900/10' },
    { name: 'Verde', value: 'from-emerald-100 to-emerald-200', border: 'border-emerald-300', text: 'text-emerald-900', shadow: 'shadow-emerald-900/10' },
    { name: 'Morado', value: 'from-violet-100 to-violet-200', border: 'border-violet-300', text: 'text-violet-900', shadow: 'shadow-violet-900/10' },
];

export default function QueTeCuentasPage() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newNote, setNewNote] = useState({ title: '', content: '', color: 'Amarillo' });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editNote, setEditNote] = useState({ title: '', content: '', color: '' });

    useEffect(() => {
        fetchNotes();
    }, []);

    const fetchNotes = async () => {
        try {
            const { data, error } = await supabase
                .from('admin_notes')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setNotes(data || []);
        } catch (err) {
            console.error('Error fetching notes:', err);
            // toast.error('No se pudieron cargar las notas');
        } finally {
            setLoading(false);
        }
    };

    const handleAddNote = async () => {
        if (!newNote.content.trim()) {
            toast.error('La nota no puede estar vacía');
            return;
        }

        try {
            const { data, error } = await supabase
                .from('admin_notes')
                .insert([{
                    title: newNote.title || 'Sin título',
                    content: newNote.content,
                    color: newNote.color,
                }])
                .select()
                .single();

            if (error) throw error;

            setNotes([data, ...notes]);
            setNewNote({ title: '', content: '', color: 'Amarillo' });
            setIsAdding(false);
            toast.success('¡Nota guardada!');
        } catch (err) {
            console.error('Error adding note:', err);
            toast.error('Error al guardar la nota');
        }
    };

    const handleDeleteNote = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const { error } = await supabase
                .from('admin_notes')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setNotes(notes.filter(n => n.id !== id));
            toast.success('Nota eliminada');
        } catch (err) {
            console.error('Error deleting note:', err);
            toast.error('Error al eliminar');
        }
    };

    const startEditing = (note: Note) => {
        setEditingId(note.id);
        setEditNote({ title: note.title, content: note.content, color: note.color });
    };

    const handleUpdateNote = async () => {
        if (!editingId) return;
        try {
            const { error } = await supabase
                .from('admin_notes')
                .update({
                    title: editNote.title,
                    content: editNote.content,
                    color: editNote.color
                })
                .eq('id', editingId);

            if (error) throw error;

            setNotes(notes.map(n => n.id === editingId ? { ...n, ...editNote } : n));
            setEditingId(null);
            toast.success('Nota actualizada');
        } catch (err) {
            console.error('Error updating note:', err);
            toast.error('Error al actualizar');
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto space-y-8 pb-20">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/5 pb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Bookmark className="text-[#008DCB]" size={20} />
                            <p className="text-[#008DCB] font-mono text-[10px] uppercase tracking-[0.2em] font-bold">Libreta Personal</p>
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-header font-black tracking-tight text-[#E8ECF1] flex items-center gap-4">
                            ¿Qué te cuentas?
                            <Sparkles className="text-amber-400 animate-pulse" size={32} />
                        </h1>
                        <p className="text-[rgba(255,255,255,0.4)] mt-4 max-w-xl text-lg leading-relaxed">
                            Este es tu rincón seguro. Deja aquí tus ideas locas, pendientes, reflexiones o simplemente lo que te pase por la cabeza.
                        </p>
                    </div>

                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-3 bg-[#008DCB] hover:bg-[#008DCB]/90 text-[#070A0F] px-8 py-4 rounded-2xl font-bold shadow-2xl shadow-[#008DCB]/20 transition-all active:scale-95 group"
                    >
                        <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                        <span>Nueva Nota</span>
                    </button>
                </div>

                {/* Notebook Paper Area */}
                <div className="relative min-h-[600px] rounded-[3rem] p-8 lg:p-12 overflow-hidden bg-[#070A0F] border border-white/5 shadow-inner">
                    {/* Notebook grid lines background */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                        style={{
                            backgroundImage: 'radial-gradient(#E8ECF1 1px, transparent 0)',
                            backgroundSize: '40px 40px'
                        }}>
                    </div>

                    {/* Adding Form Overlay */}
                    {isAdding && (
                        <div className="mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="bg-[#141A23] border border-[#1F2937] rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-2 h-full bg-[#008DCB]"></div>

                                <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-xl font-bold text-[#E8ECF1]">Escribiendo algo nuevo...</h3>
                                        <button onClick={() => setIsAdding(false)} className="text-[rgba(255,255,255,0.3)] hover:text-[#E8ECF1]">
                                            <X size={24} />
                                        </button>
                                    </div>

                                    <div className="grid gap-6">
                                        <input
                                            type="text"
                                            placeholder="Título de la reflexión..."
                                            className="w-full bg-[#070A0F] border border-[#1F2937] rounded-xl px-4 py-3 text-[#E8ECF1] placeholder:text-[rgba(255,255,255,0.2)] focus:outline-none focus:border-[#008DCB]/50"
                                            value={newNote.title}
                                            onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                                        />
                                        <textarea
                                            placeholder="Suelta todo lo que tengas en mente aquí..."
                                            rows={5}
                                            className="w-full bg-[#070A0F] border border-[#1F2937] rounded-xl px-4 py-3 text-[#E8ECF1] placeholder:text-[rgba(255,255,255,0.2)] focus:outline-none focus:border-[#008DCB]/50 resize-none font-sans"
                                            value={newNote.content}
                                            onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                                        />
                                    </div>

                                    <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                                        <div className="flex gap-3">
                                            {COLORS.map(c => (
                                                <button
                                                    key={c.name}
                                                    onClick={() => setNewNote({ ...newNote, color: c.name })}
                                                    className={cn(
                                                        "w-8 h-8 rounded-full border-2 transition-all p-1",
                                                        newNote.color === c.name ? "border-[#008DCB] scale-110" : "border-transparent",
                                                        "bg-gradient-to-br", c.value
                                                    )}
                                                    title={c.name}
                                                />
                                            ))}
                                        </div>
                                        <div className="flex gap-4 w-full sm:w-auto">
                                            <button
                                                onClick={() => setIsAdding(false)}
                                                className="flex-1 sm:flex-none px-6 py-3 rounded-xl border border-[#1F2937] text-[rgba(255,255,255,0.5)] hover:text-[#E8ECF1] hover:bg-[#1F2937] transition-all font-bold"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={handleAddNote}
                                                className="flex-1 sm:flex-none px-8 py-3 rounded-xl bg-[#008DCB] text-[#070A0F] font-black transition-all hover:scale-105"
                                            >
                                                Guardar Pensamiento
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notes Grid */}
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-64 rounded-3xl bg-white/5 animate-pulse border border-white/5"></div>
                            ))}
                        </div>
                    ) : notes.length === 0 && !isAdding ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
                            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center text-[rgba(255,255,255,0.1)]">
                                <Edit2 size={48} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-[rgba(255,255,255,0.3)]">Aún no has escrito nada...</h3>
                                <p className="text-[rgba(255,255,255,0.15)] mt-2">¿Por qué no empiezas con una pequeña nota hoy?</p>
                            </div>
                            <button
                                onClick={() => setIsAdding(true)}
                                className="text-[#008DCB] font-bold hover:underline"
                            >
                                Crear mi primera nota
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {notes.map((note, index) => {
                                const colorCfg = COLORS.find(c => c.name === note.color) || COLORS[0];
                                const rotation = (index % 3 === 0) ? '-1deg' : (index % 3 === 1) ? '0.5deg' : '-0.5deg';

                                return (
                                    <div
                                        key={note.id}
                                        className={cn(
                                            "group relative p-8 rounded-lg shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border-t-4",
                                            "bg-gradient-to-br", colorCfg.value,
                                            colorCfg.border, colorCfg.text, colorCfg.shadow,
                                            "hover:scale-[1.02] hover:-translate-y-1 hover:shadow-2xl"
                                        )}
                                        style={{ transform: `rotate(${rotation})` }}
                                        onClick={() => startEditing(note)}
                                    >
                                        {/* Paper Tape Effect */}
                                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-16 h-8 bg-white/30 backdrop-blur-sm -rotate-2 z-10 border border-white/20"></div>

                                        {editingId === note.id ? (
                                            <div className="space-y-4 pt-4" onClick={e => e.stopPropagation()}>
                                                <input
                                                    className="w-full bg-transparent border-b border-black/10 focus:outline-none font-bold text-lg"
                                                    value={editNote.title}
                                                    onChange={e => setEditNote({ ...editNote, title: e.target.value })}
                                                    autoFocus
                                                />
                                                <textarea
                                                    className="w-full bg-transparent focus:outline-none resize-none min-h-[120px]"
                                                    value={editNote.content}
                                                    onChange={e => setEditNote({ ...editNote, content: e.target.value })}
                                                />
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => setEditingId(null)} className="p-2 hover:bg-black/5 rounded-full">
                                                        <X size={18} />
                                                    </button>
                                                    <button onClick={handleUpdateNote} className="p-2 bg-black text-white rounded-full">
                                                        <Check size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-4 pt-4">
                                                <div className="flex justify-between items-start">
                                                    <h3 className="font-header font-black text-xl leading-tight">
                                                        {note.title}
                                                    </h3>
                                                    <button
                                                        onClick={(e) => handleDeleteNote(note.id, e)}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-black/5 rounded-lg"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                                <p className="font-sans leading-relaxed whitespace-pre-wrap opacity-80 overflow-hidden text-ellipsis line-clamp-6">
                                                    {note.content}
                                                </p>
                                                <div className="pt-4 mt-auto flex justify-between items-center opacity-60">
                                                    <p className="text-[10px] font-mono font-bold uppercase tracking-wider">
                                                        {format(new Date(note.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                                                    </p>
                                                    <Edit2 size={12} className="group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Motivational Footer */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-12">
                    {[
                        { icon: Coffee, text: "Tómate un café y escribe" },
                        { icon: Zap, text: "Ideas que valen oro" },
                        { icon: LifeBuoy, text: "Prioriza tu calma" },
                        { icon: Sparkles, text: "Creatividad sin límites" }
                    ].map((item, i) => (
                        <div key={i} className="flex flex-col items-center gap-3 p-6 rounded-3xl bg-white/5 border border-white/5 text-center group hover:bg-white/10 transition-all">
                            <item.icon className="text-[#008DCB] group-hover:scale-110 transition-transform" size={24} />
                            <p className="text-[10px] font-bold text-[rgba(255,255,255,0.4)] uppercase tracking-widest">{item.text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}
