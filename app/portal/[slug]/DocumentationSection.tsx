"use client";

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import {
    FileText, Upload, Trash2, Eye,
    Loader2, X, File, ExternalLink
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
    const [previewItem, setPreviewItem] = useState<DocItem | null>(null);
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

        if (file.size > 10 * 1024 * 1024) {
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

    // Helper to determine if file can be previewed in modal
    const canPreview = (fileName?: string) => {
        if (!fileName) return false;
        const ext = fileName.split('.').pop()?.toLowerCase();
        return ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'txt'].includes(ext || '');
    };

    return (
        <Card className="border-[#1F2937] shadow-xl shadow-black/20 rounded-[2rem] overflow-hidden bg-[#0E1219]">
            <CardHeader className="px-6 pt-8 pb-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                        <CardTitle className="text-xl font-bold text-[#E8ECF1]">Documentación</CardTitle>
                        <p className="text-xs text-[rgba(255,255,255,0.4)] mt-1 font-medium italic truncate">PDF, DOCX, TXT o MD.</p>
                    </div>
                    <div className="p-2 bg-[#008DCB]/10 rounded-xl text-[#008DCB] border border-[#008DCB]/20 shrink-0">
                        <FileText size={18} />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="px-6 pb-8 pt-2 space-y-6">
                {/* Upload Area */}
                <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                        "relative group cursor-pointer border-2 border-dashed rounded-2xl p-6 transition-all duration-300 text-center",
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
                    <div className="flex flex-col items-center gap-3">
                        <div className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300",
                            uploading ? "bg-[#141A23]" : "bg-[#141A23] group-hover:bg-[#008DCB]/20"
                        )}>
                            {uploading ? (
                                <Loader2 className="animate-spin text-[#008DCB]" size={24} />
                            ) : (
                                <Upload size={24} className="text-[rgba(255,255,255,0.3)] group-hover:text-[#008DCB]" />
                            )}
                        </div>
                        <div>
                            <p className="text-xs font-bold text-[#E8ECF1] mb-1">
                                {uploading ? 'Subiendo...' : 'Subir o arrastrar'}
                            </p>
                            <p className="text-[10px] text-[rgba(255,255,255,0.4)] font-medium">
                                Máximo 10MB
                            </p>
                        </div>
                    </div>
                </div>

                {/* File List */}
                <div className="space-y-2">
                    {loading ? (
                        <div className="space-y-2">
                            {[1, 2].map(i => (
                                <div key={i} className="h-14 bg-[#141A23] rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : items.length === 0 ? (
                        <div className="py-6 text-center border border-dashed border-[#1F2937] rounded-xl bg-[#070A0F]/50">
                            <p className="text-[10px] font-bold text-[rgba(255,255,255,0.2)] uppercase tracking-widest leading-loose">No hay documentos</p>
                        </div>
                    ) : (
                        <div className="grid gap-2">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between p-3 bg-[#070A0F] border border-[#1F2937] rounded-xl hover:border-[#008DCB]/30 transition-all group overflow-hidden"
                                >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="p-2 bg-[#141A23] rounded-lg text-[#67B7AF] shrink-0">
                                            <File size={16} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-[#E8ECF1] truncate pr-2">{item.title}</p>
                                            <p className="text-[9px] text-[rgba(255,255,255,0.3)] font-mono">
                                                {new Date(item.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            onClick={() => canPreview(item.file_name) ? setPreviewItem(item) : window.open(item.content, '_blank')}
                                            className="p-2 hover:bg-[#008DCB]/10 text-[rgba(255,255,255,0.4)] hover:text-[#008DCB] rounded-lg transition-colors"
                                            title="Ver documento"
                                        >
                                            <Eye size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item)}
                                            className="p-2 hover:bg-red-500/10 text-[rgba(255,255,255,0.4)] hover:text-red-500 rounded-lg transition-colors"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>

            {/* Preview Modal */}
            {previewItem && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#0E1219] w-full max-w-5xl h-[85vh] rounded-[2rem] shadow-2xl overflow-hidden border border-[#1F2937] flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-[#1F2937] flex justify-between items-center bg-[#070A0F]/50">
                            <div className="flex items-center gap-3 min-w-0">
                                <FileText className="text-[#008DCB]" size={20} />
                                <h3 className="text-lg font-bold text-[#E8ECF1] truncate">{previewItem.title}</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <a
                                    href={previewItem.content}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2.5 hover:bg-[#141A23] text-[rgba(255,255,255,0.5)] hover:text-[#008DCB] rounded-xl transition-all"
                                    title="Abrir en pestaña nueva"
                                >
                                    <ExternalLink size={20} />
                                </a>
                                <button
                                    onClick={() => setPreviewItem(null)}
                                    className="p-2.5 hover:bg-[#141A23] text-[rgba(255,255,255,0.5)] hover:text-[#E8ECF1] rounded-xl transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-hidden bg-[#141A23]">
                            {previewItem.file_name?.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                                <div className="w-full h-full flex items-center justify-center p-8">
                                    <img
                                        src={previewItem.content}
                                        alt={previewItem.title}
                                        className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                                    />
                                </div>
                            ) : (
                                <iframe
                                    src={`${previewItem.content}#toolbar=0`}
                                    className="w-full h-full border-none"
                                    title="Document Preview"
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
}
