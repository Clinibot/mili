"use client";

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import {
    FileText, Upload, Trash2, Eye,
    Loader2, X, File, FileCode
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocItem {
    id: string;
    created_at: string;
    title: string;
    type: 'url' | 'file';
    content: string;
    file_name?: string;
}

export default function DocumentationSection({ clientId }: { clientId: string }) {
    const [items, setItems] = useState<DocItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchDocs();
    }, [clientId]);

    const fetchDocs = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('documentation_items')
                .select('*')
                .eq('client_id', clientId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setItems(data || []);
        } catch (error) {
            console.error('Error fetching docs:', error);
            toast.error('Error al cargar la documentación');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (file: File) => {
        const allowedExtensions = ['txt', 'md', 'pdf', 'doc', 'docx'];
        const fileExt = file.name.split('.').pop()?.toLowerCase();

        if (!fileExt || !allowedExtensions.includes(fileExt)) {
            toast.error('Formato no permitido. Usa .txt, .md, .pdf, .doc o .docx');
            return;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            toast.error('El archivo es demasiado grande (Máx 10MB)');
            return;
        }

        setUploading(true);
        const toastId = toast.loading('Subiendo archivo...');

        try {
            const fileName = `${clientId}/${Math.random().toString(36).substring(2)}_${file.name}`;
            const filePath = `docs/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('documentation')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('documentation')
                .getPublicUrl(filePath);

            const { error: insertError } = await supabase
                .from('documentation_items')
                .insert([{
                    title: file.name,
                    type: 'file',
                    content: publicUrl,
                    file_name: file.name,
                    client_id: clientId
                }]);

            if (insertError) throw insertError;

            toast.success('Archivo subido correctamente', { id: toastId });
            fetchDocs();
        } catch (error: any) {
            console.error('Error uploading:', error);
            toast.error(error.message || 'Error al subir el archivo', { id: toastId });
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (item: DocItem) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este documento?')) return;

        try {
            const { error } = await supabase
                .from('documentation_items')
                .delete()
                .eq('id', item.id);

            if (error) throw error;
            toast.success('Documento eliminado');
            setItems(items.filter(i => i.id !== item.id));
        } catch (error) {
            toast.error('No se pudo eliminar el documento');
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    };

    return (
        <Card className="border-[#1F2937] shadow-xl shadow-black/20 rounded-[32px] overflow-hidden bg-[#0E1219]">
            <CardHeader className="px-10 pt-10 pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-bold text-[#E8ECF1]">Documentación</CardTitle>
                        <p className="text-xs text-[rgba(255,255,255,0.4)] mt-1 font-medium italic">Sube archivos .pdf, .docx, .txt o .md para enviárnoslos.</p>
                    </div>
                    <div className="p-2.5 bg-[#008DCB]/10 rounded-2xl text-[#008DCB] border border-[#008DCB]/20">
                        <FileText size={20} />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="px-10 pb-10 pt-4 space-y-8">
                {/* Upload Area */}
                <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                        "relative group cursor-pointer border-2 border-dashed rounded-3xl p-10 transition-all duration-300 text-center",
                        dragActive
                            ? "border-[#008DCB] bg-[#008DCB]/5"
                            : "border-[#1F2937] hover:border-[#008DCB]/50 hover:bg-[#141A23]"
                    )}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".txt,.md,.pdf,.doc,.docx"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                    />
                    <div className="flex flex-col items-center gap-4">
                        <div className={cn(
                            "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300",
                            uploading ? "bg-[#141A23]" : "bg-[#141A23] group-hover:bg-[#008DCB]/20"
                        )}>
                            {uploading ? (
                                <Loader2 className="animate-spin text-[#008DCB]" size={32} />
                            ) : (
                                <Upload size={32} className="text-[rgba(255,255,255,0.3)] group-hover:text-[#008DCB]" />
                            )}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-[#E8ECF1] mb-1">
                                {uploading ? 'Subiendo documento...' : 'Haz clic para subir o arrastra'}
                            </p>
                            <p className="text-xs text-[rgba(255,255,255,0.4)] font-medium">
                                TXT, MD, PDF, DOC (Máx 10MB)
                            </p>
                        </div>
                    </div>
                </div>

                {/* File List */}
                <div className="space-y-3">
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2].map(i => (
                                <div key={i} className="h-16 bg-[#141A23] rounded-2xl animate-pulse" />
                            ))}
                        </div>
                    ) : items.length === 0 ? (
                        <div className="py-8 text-center border border-dashed border-[#1F2937] rounded-2xl bg-[#070A0F]/50">
                            <p className="text-xs font-bold text-[rgba(255,255,255,0.2)] uppercase tracking-widest">No hay documentos subidos</p>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between p-4 bg-[#070A0F] border border-[#1F2937] rounded-2xl hover:border-[#008DCB]/30 transition-all group"
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="p-2.5 bg-[#141A23] rounded-xl text-[#67B7AF]">
                                            <File size={18} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-[#E8ECF1] truncate pr-4">{item.title}</p>
                                            <p className="text-[10px] text-[rgba(255,255,255,0.3)] font-mono">
                                                {new Date(item.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <a
                                            href={item.content}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 hover:bg-[#008DCB]/10 text-[rgba(255,255,255,0.3)] hover:text-[#008DCB] rounded-lg transition-colors"
                                            title="Ver documento"
                                        >
                                            <Eye size={18} />
                                        </a>
                                        <button
                                            onClick={() => handleDelete(item)}
                                            className="p-2 hover:bg-red-500/10 text-[rgba(255,255,255,0.3)] hover:text-red-500 rounded-lg transition-colors"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
