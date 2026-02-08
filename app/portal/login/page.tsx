"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

            // Redirect to the portal dashboard
            router.push(data.redirectUrl);
        } catch (err: any) {
            console.error('Portal login error:', err);
            toast.error(err.message || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <Toaster />
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                        IA para llamadas
                    </h1>
                    <p className="mt-2 text-slate-500">Portal de Clientes</p>
                </div>

                <Card className="border-slate-100 shadow-xl rounded-2xl bg-white overflow-hidden">
                    <CardHeader className="bg-white border-b border-slate-50 pb-6">
                        <CardTitle className="text-xl font-bold text-center text-slate-800">Acceso Seguro</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-8">
                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700" htmlFor="username">Usuario</label>
                                <input
                                    id="username"
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                    placeholder="Usuario asignado"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700" htmlFor="password">Contraseña</label>
                                <input
                                    id="password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-slate-200 text-blue-600 focus:ring-blue-500/20 transition-all"
                                        defaultChecked
                                    />
                                    <span className="text-sm text-slate-500 group-hover:text-slate-700 transition-colors">Recordarme</span>
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50"
                            >
                                {loading ? 'Accediendo...' : 'Entrar al Panel'}
                            </button>
                        </form>
                    </CardContent>
                </Card>

                <p className="text-center text-xs text-slate-400">
                    &copy; 2026 IA para llamadas. Todos los derechos reservados.
                </p>
            </div>
        </div>
    );
}
