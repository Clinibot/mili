"use client";

import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Book, FileText, ExternalLink } from 'lucide-react';

export default function DocsPage() {
    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-bold text-slate-900">Documentación</h1>
                    <p className="text-slate-500">Guías y recursos para la gestión de la plataforma</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-slate-100 shadow-sm hover:shadow-md transition-shadow rounded-2xl cursor-not-allowed opacity-60">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Book className="text-blue-600" size={20} />
                                Guía de Inicio Rápido
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-slate-500">Aprende los conceptos básicos para configurar tu primer cliente.</p>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-100 shadow-sm hover:shadow-md transition-shadow rounded-2xl cursor-not-allowed opacity-60">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <FileText className="text-purple-600" size={20} />
                                Configuración de Agentes
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-slate-500">Detalles técnicos sobre la personalidad y tareas de la IA.</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="bg-blue-50 border border-blue-100 p-8 rounded-3xl text-center">
                    <h2 className="text-xl font-bold text-blue-900 mb-2">Próximamente</h2>
                    <p className="text-blue-700/80 max-w-md mx-auto">
                        Estamos preparando contenido detallado para ayudarte a sacar el máximo provecho de la IA para llamadas.
                    </p>
                </div>
            </div>
        </DashboardLayout>
    );
}
