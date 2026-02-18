"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, Mail, Lock, ShieldCheck, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

export default function PortalLoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/auth/portal-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: username, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Credenciales incorrectas');
            }

            toast.success('Sesión iniciada correctamente');
            router.push(data.redirectUrl);
        } catch (err: any) {
            console.error('Portal login error:', err);
            toast.error(err.message || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#070A0F] flex flex-col items-center justify-center p-4 font-sans text-[#E8ECF1]">
            <Toaster position="top-center" richColors />

            {/* Logo and Intro Section */}
            <div className="w-full max-w-md text-center mb-8 space-y-4">
                <div className="w-20 h-20 bg-[#008DCB]/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-[#008DCB]/20 shadow-2xl shadow-[#008DCB]/10">
                    <Bot size={40} className="text-[#008DCB]" />
                </div>
                <h1 className="text-3xl font-black text-white tracking-tight">Mili y son-ia</h1>
                <p className="text-[rgba(232,236,241,0.5)] text-sm leading-relaxed max-w-sm mx-auto font-medium">
                    Portal Exclusivo para Clientes
                </p>
            </div>

            <div className="w-full max-w-md bg-[#0E1219] border border-[#1F2937] rounded-[32px] p-8 lg:p-10 shadow-3xl shadow-black/50 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#008DCB] to-transparent opacity-50"></div>

                <div className="mb-8 p-4 bg-[#141A23] border border-[#1F2937] rounded-2xl flex items-start gap-3">
                    <ShieldCheck className="text-[#008DCB] flex-shrink-0 mt-0.5" size={18} />
                    <p className="text-[11px] font-bold text-[rgba(232,236,241,0.6)] uppercase tracking-wider leading-relaxed">
                        Este acceso es de uso exclusivo de los clientes de Mili Pérez y Sonia Ortiz.
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-black text-[#008DCB] uppercase tracking-widest ml-1" htmlFor="username">Usuario</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4B5563]" size={20} />
                            <input
                                id="username"
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-[#141A23] border border-[#1F2937] rounded-2xl focus:outline-none focus:border-[#008DCB] transition-all text-white placeholder:text-[#4B5563] font-medium"
                                placeholder="Usuario asignado"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-[#008DCB] uppercase tracking-widest ml-1" htmlFor="password">Contraseña</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4B5563]" size={20} />
                            <input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-[#141A23] border border-[#1F2937] rounded-2xl focus:outline-none focus:border-[#008DCB] transition-all text-white placeholder:text-[#4B5563] font-medium"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between px-1">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative flex items-center">
                                <input
                                    type="checkbox"
                                    className="peer w-5 h-5 opacity-0 absolute cursor-pointer"
                                    defaultChecked
                                />
                                <div className="w-5 h-5 bg-[#141A23] border border-[#1F2937] rounded-lg peer-checked:bg-[#008DCB] peer-checked:border-[#008DCB] transition-all flex items-center justify-center">
                                    <ShieldCheck className="text-[#070A0F] peer-checked:block hidden" size={14} />
                                </div>
                            </div>
                            <span className="text-xs font-bold text-[#4B5563] group-hover:text-[rgba(232,236,241,0.6)] transition-colors uppercase tracking-widest">Recordarme</span>
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#008DCB] hover:bg-[#008DCB]/90 text-[#070A0F] font-black py-4 rounded-2xl shadow-xl shadow-[#008DCB]/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 text-sm uppercase tracking-widest"
                    >
                        {loading ? 'Accediendo...' : 'Entrar al Panel Cliente'}
                    </button>
                </form>
            </div>

            {/* Verification Footer */}
            <div className="mt-12 text-center space-y-4">
                <div className="flex items-center justify-center gap-6">
                    <a href="/politica-privacidad" className="text-xs font-bold text-[#4B5563] hover:text-[#008DCB] transition-colors uppercase tracking-widest">Privacidad</a>
                    <div className="w-1 h-1 bg-[#1F2937] rounded-full"></div>
                    <a href="/condiciones-servicio" className="text-xs font-bold text-[#4B5563] hover:text-[#008DCB] transition-colors uppercase tracking-widest">Términos</a>
                </div>
                <p className="text-[10px] text-[#4B5563] font-medium uppercase tracking-widest">
                    &copy; {new Date().getFullYear()} Mili y son-ia — centrodemando.es
                </p>
            </div>
        </div>
    );
}
