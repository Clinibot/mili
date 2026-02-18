"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Mail, Loader2, AlertCircle, Bot, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error al iniciar sesión');
            }

            toast.success('Sesión iniciada correctamente');
            window.location.href = '/';
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.message || 'Error al iniciar sesión');
            toast.error('Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#070A0F] p-4 font-sans text-[#E8ECF1]">
            {/* Logo and Intro Section */}
            <div className="w-full max-w-md text-center mb-8 space-y-4">
                <div className="w-20 h-20 bg-[#008DCB]/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-[#008DCB]/20 shadow-2xl shadow-[#008DCB]/10">
                    <Bot size={40} className="text-[#008DCB]" />
                </div>
                <h1 className="text-4xl font-black text-white tracking-tight">Mili y son-ia</h1>
                <p className="text-[rgba(232,236,241,0.5)] text-sm leading-relaxed max-w-sm mx-auto">
                    Somos creadores de agentes de voz para llamadas. Esta plataforma es para uso exclusivo de los clientes de <strong>Mili Pérez</strong> y <strong>Sonia Ortiz</strong>.
                </p>
            </div>

            <div className="w-full max-w-md bg-[#0E1219] border border-[#1F2937] rounded-[32px] p-8 lg:p-10 shadow-3xl shadow-black/50 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#008DCB] to-transparent opacity-50"></div>

                <div className="mb-8 p-4 bg-[#141A23] border border-[#1F2937] rounded-2xl flex items-start gap-3">
                    <ShieldCheck className="text-[#008DCB] flex-shrink-0 mt-0.5" size={18} />
                    <p className="text-[11px] font-bold text-[rgba(232,236,241,0.6)] uppercase tracking-wider leading-relaxed">
                        Aviso: https://centrodemando.es es de uso exclusivo para clientes autorizados.
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-black text-[#008DCB] uppercase tracking-widest ml-1" htmlFor="email">Email de Acceso</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4B5563]" size={20} />
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-[#141A23] border border-[#1F2937] rounded-2xl focus:outline-none focus:border-[#008DCB] transition-all text-white placeholder:text-[#4B5563] font-medium"
                                placeholder="tu@email.com"
                                required
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
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-[#141A23] border border-[#1F2937] rounded-2xl focus:outline-none focus:border-[#008DCB] transition-all text-white placeholder:text-[#4B5563] font-medium"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold flex items-center gap-3">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#008DCB] hover:bg-[#008DCB]/90 text-[#070A0F] font-black py-4 rounded-2xl shadow-xl shadow-[#008DCB]/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 text-sm uppercase tracking-widest"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : 'Entrar al Control de Mando'}
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
                    &copy; {new Date().getFullYear()} Mili y son-ia — centrodemando.es — v2.0
                </p>
            </div>
        </div>
    );
}
