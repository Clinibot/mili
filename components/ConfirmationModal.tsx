"use client";

import { X } from "lucide-react";

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    destructive?: boolean;
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    destructive = false,
}: ConfirmationModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
            <div
                className="bg-[#0E1219] border border-[#1F2937] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[#1F2937]">
                    <h3 className="text-lg font-bold text-[#E8ECF1]">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg text-[rgba(255,255,255,0.4)] hover:text-[#E8ECF1] hover:bg-[#141A23] transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <p className="text-[rgba(255,255,255,0.7)] text-sm leading-relaxed">
                        {message}
                    </p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-4 bg-[#141A23] border-t border-[#1F2937]">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-bold text-[rgba(255,255,255,0.7)] hover:text-[#E8ECF1] hover:bg-[#0E1219] rounded-lg transition-colors border border-transparent hover:border-[#1F2937]"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`px-4 py-2 text-sm font-bold text-[#070A0F] rounded-lg shadow-xl transition-all active:scale-95
              ${destructive
                                ? "bg-[#F78E5E] hover:bg-[#F78E5E]/90 shadow-[#F78E5E]/20"
                                : "bg-[#008DCB] hover:bg-[#008DCB]/90 shadow-[#008DCB]/20"
                            }
            `}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
