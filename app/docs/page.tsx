"use client";

import { useEffect, useState, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import {
    Book, FileText, ExternalLink, Plus, Trash2,
    Upload, Link as LinkIcon, Loader2, X, Eye,
    FileCode, Image as ImageIcon, File
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface DocItem {
    id: string;
    created_at: string;
    title: string;
    type: 'url' | 'file';
    content: string;
    file_name?: string;
    created_by?: string;
}

export default function DocsPage() {
    const [items, setItems] = useState<DocItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [docType, setDocType] = useState<'url' | 'file'>('url');
    const [url, setUrl] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('documentation_items')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching docs:', error);
            toast.error('Error al cargar la documentación');
        } else {
            setItems(data || []);
        }
        setLoading(false);
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            let content = url;

            if (docType === 'file' && file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
                const filePath = `shared/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('documentation')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                // Get public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('documentation')
                    .getPublicUrl(filePath);

                content = publicUrl;
            }

            const { error: insertError } = await supabase
                .from('documentation_items')
                .insert([{
                    title,
                    type: docType,
                    content,
                    file_name: docType === 'file' ? file?.name : null,
                    created_by: user?.email
                }]);

            if (insertError) throw insertError;

            toast.success('Documento añadido correctamente');
            setIsAddOpen(false);
            setTitle('');
            setUrl('');
            setFile(null);
            fetchItems();
        } catch (err: any) {
            console.error('Error adding doc:', err);
            toast.error(err.message || 'Error al añadir el documento');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (item: DocItem) => {
        if (!confirm('¿Estás seguro de que quieres eliminar este elemento?')) return;

        try {
            // If it's a file, we should technically delete it from storage too
            // but for now let's just remove the DB entry
            const { error } = await supabase
                .from('documentation_items')
                .delete()
                .eq('id', item.id);

            if (error) throw error;
            toast.success('Elemento eliminado');
            fetchItems();
        } catch (err: any) {
            toast.error('Error al eliminar');
        }
    };

    const renderIcon = (item: DocItem) => {
        if (item.type === 'url') return <LinkIcon className="text-[#008DCB]" size={20} />;
        if (item.file_name?.match(/\.(jpg|jpeg|png|gif)$/i)) return <ImageIcon className="text-[#F78E5E]" size={20} />;
        if (item.file_name?.match(/\.(pdf)$/i)) return <FileText className="text-[#67B7AF]" size={20} />;
        return <File className="text-[rgba(255,255,255,0.4)]" size={20} />;
    };

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-bold text-[#E8ECF1] tracking-tight">Documentación Compartida</h1>
                        <p className="text-[rgba(255,255,255,0.55)] mt-2">Recursos y guías para Sonia y Mili.</p>
                    </div>
                    <button
                        onClick={() => setIsAddOpen(true)}
                        className="bg-[#008DCB] hover:bg-[#007AB0] text-white px-5 py-2.5 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-[#008DCB]/20 transition-all active:scale-95"
                    >
                        <Plus size={20} />
                        Añadir Recurso
                    </button>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-48 bg-[#0E1219] border border-[#1F2937] rounded-3xl animate-pulse" />
                        ))}
                    </div>
                ) : items.length === 0 ? (
                    <div className="bg-[#0E1219] border border-dashed border-[#1F2937] rounded-3xl p-16 text-center">
                        <div className="w-16 h-16 bg-[#141A23] rounded-full flex items-center justify-center mx-auto mb-4 text-[rgba(255,255,255,0.3)]">
                            <Book size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-[#E8ECF1]">No hay documentos aún</h3>
                        <p className="text-[rgba(255,255,255,0.55)] mt-1">Empieza por subir una URL o un documento importante.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {items.map((item) => (
                            <Card key={item.id} className="group border-[#1F2937] shadow-sm hover:shadow-xl hover:border-[#008DCB]/30 transition-all duration-300 rounded-3xl overflow-hidden bg-[#0E1219]">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-2.5 bg-[#141A23] rounded-2xl group-hover:bg-[#008DCB]/10 transition-colors">
                                            {renderIcon(item)}
                                        </div>
                                        <button
                                            onClick={() => handleDelete(item)}
                                            className="text-[rgba(255,255,255,0.3)] hover:text-[#EF4444] p-2 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    <h3 className="font-bold text-[#E8ECF1] text-lg mb-1 leading-tight">{item.title}</h3>
                                    <p className="text-sm text-[rgba(255,255,255,0.4)] mb-6 truncate max-w-full">
                                        {item.type === 'file' ? item.file_name : item.content}
                                    </p>

                                    <div className="flex gap-2">
                                        <a
                                            href={item.content}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 bg-[#141A23] hover:bg-[#008DCB]/10 text-[#E8ECF1] hover:text-[#008DCB] py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 border border-transparent hover:border-[#008DCB]/20"
                                        >
                                            {item.type === 'url' ? <ExternalLink size={16} /> : <Eye size={16} />}
                                            {item.type === 'url' ? 'Abrir Enlace' : 'Ver Documento'}
                                        </a>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Add Modal Placeholder */}
                {isAddOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-[#0E1219] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-[#1F2937] animate-in zoom-in-95 duration-200">
                            <div className="p-6 border-b border-[#1F2937] flex justify-between items-center">
                                <h2 className="text-xl font-bold text-[#E8ECF1]">Añadir Recurso</h2>
                                <button onClick={() => setIsAddOpen(false)} className="text-[rgba(255,255,255,0.3)] hover:text-[#E8ECF1]">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleAdd} className="p-6 space-y-5">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-[rgba(255,255,255,0.7)]">Título</label>
                                    <input
                                        type="text"
                                        required
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-[#141A23] border border-[#1F2937] text-[#E8ECF1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008DCB]/20 focus:border-[#008DCB] transition-all"
                                        placeholder="Ej: Manual de Zadarma"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-[rgba(255,255,255,0.7)]">Tipo de Recurso</label>
                                    <div className="flex bg-[#141A23] p-1 rounded-xl border border-[#1F2937]">
                                        <button
                                            type="button"
                                            onClick={() => setDocType('url')}
                                            className={cn("flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2",
                                                docType === 'url' ? "bg-[#008DCB]/10 text-[#008DCB] border border-[#008DCB]/20" : "text-[rgba(255,255,255,0.55)] hover:text-[#E8ECF1]")}
                                        >
                                            <LinkIcon size={16} />
                                            Enlace URL
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDocType('file')}
                                            className={cn("flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2",
                                                docType === 'file' ? "bg-[#008DCB]/10 text-[#008DCB] border border-[#008DCB]/20" : "text-[rgba(255,255,255,0.55)] hover:text-[#E8ECF1]")}
                                        >
                                            <Upload size={16} />
                                            Documento
                                        </button>
                                    </div>
                                </div>

                                {docType === 'url' ? (
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-[rgba(255,255,255,0.7)]">URL</label>
                                        <input
                                            type="url"
                                            required
                                            value={url}
                                            onChange={(e) => setUrl(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-[#141A23] border border-[#1F2937] text-[#E8ECF1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008DCB]/20 focus:border-[#008DCB] transition-all"
                                            placeholder="https://ejemplo.com/guia"
                                        />
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-[rgba(255,255,255,0.7)]">Archivo</label>
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="cursor-pointer group border-2 border-dashed border-[#1F2937] bg-[#141A23] rounded-2xl p-8 text-center hover:border-[#008DCB] hover:bg-[#008DCB]/5 transition-all"
                                        >
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                className="hidden"
                                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                            />
                                            {file ? (
                                                <div className="flex items-center justify-center gap-2 text-[#008DCB] font-bold">
                                                    <FileText size={20} />
                                                    {file.name}
                                                </div>
                                            ) : (
                                                <div className="text-[rgba(255,255,255,0.4)] group-hover:text-[#008DCB] transition-colors">
                                                    <Upload size={32} className="mx-auto mb-2" />
                                                    <p className="text-sm font-bold">Haz clic para subir o arrastra un archivo</p>
                                                    <p className="text-xs mt-1">PDF, Imagen o Texto (Máx 5MB)</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <button
                                    disabled={uploading}
                                    className="w-full bg-[#008DCB] hover:bg-[#007AB0] disabled:opacity-50 text-white font-bold py-3 rounded-2xl shadow-lg shadow-[#008DCB]/20 transition-all flex items-center justify-center gap-2"
                                >
                                    {uploading ? <Loader2 className="animate-spin" size={20} /> : 'Añadir a la lista'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
