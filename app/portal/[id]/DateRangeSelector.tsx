"use client";

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay } from 'date-fns';

type DatePreset = 'today' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'custom';
type ViewMode = 'daily' | 'weekly' | 'monthly';
type ComparisonMode = 'none' | 'previousPeriod' | 'custom';

interface DateRangeSelectorProps {
    onRangeChange: (startDate: Date, endDate: Date, viewMode: ViewMode, comparisonMode: ComparisonMode, comparisonStart?: Date, comparisonEnd?: Date) => void;
}

export default function DateRangeSelector({ onRangeChange }: DateRangeSelectorProps) {
    const [preset, setPreset] = useState<DatePreset>('last7days');
    const [viewMode, setViewMode] = useState<ViewMode>('daily');
    const [comparisonMode, setComparisonMode] = useState<ComparisonMode>('none');
    const [customStart, setCustomStart] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
    const [customEnd, setCustomEnd] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [comparisonStart, setComparisonStart] = useState(format(subDays(new Date(), 14), 'yyyy-MM-dd'));
    const [comparisonEnd, setComparisonEnd] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));

    const getDateRangeFromPreset = (presetType: DatePreset): { start: Date; end: Date } => {
        const now = new Date();
        switch (presetType) {
            case 'today':
                return { start: startOfDay(now), end: now };
            case 'last7days':
                return { start: subDays(now, 6), end: now };
            case 'last30days':
                return { start: subDays(now, 29), end: now };
            case 'thisMonth':
                return { start: startOfMonth(now), end: endOfMonth(now) };
            case 'lastMonth':
                const lastMonth = subMonths(now, 1);
                return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
            case 'custom':
                return { start: new Date(customStart), end: new Date(customEnd) };
        }
    };

    const handlePresetChange = (newPreset: DatePreset) => {
        setPreset(newPreset);
        const range = getDateRangeFromPreset(newPreset);
        applyChanges(range.start, range.end, viewMode, comparisonMode);
    };

    const applyChanges = (start: Date, end: Date, view: ViewMode, comparison: ComparisonMode) => {
        let compStart: Date | undefined;
        let compEnd: Date | undefined;

        if (comparison === 'previousPeriod') {
            const diff = end.getTime() - start.getTime();
            compEnd = new Date(start.getTime() - 86400000); // 1 day before start
            compStart = new Date(compEnd.getTime() - diff);
        } else if (comparison === 'custom') {
            compStart = new Date(comparisonStart);
            compEnd = new Date(comparisonEnd);
        }

        onRangeChange(start, end, view, comparison, compStart, compEnd);
    };

    const handleApplyCustom = () => {
        const start = new Date(customStart);
        const end = new Date(customEnd);
        applyChanges(start, end, viewMode, comparisonMode);
    };

    return (
        <Card className="border-slate-100 shadow-sm bg-white">
            <CardContent className="p-6">
                <div className="space-y-4">
                    {/* Preset Buttons */}
                    <div>
                        <label className="text-sm font-semibold text-slate-700 mb-2 block">Rango de Tiempo</label>
                        <div className="flex flex-wrap gap-2">
                            {[
                                { value: 'today', label: 'Hoy' },
                                { value: 'last7days', label: 'Últimos 7 días' },
                                { value: 'last30days', label: 'Últimos 30 días' },
                                { value: 'thisMonth', label: 'Este mes' },
                                { value: 'lastMonth', label: 'Mes pasado' },
                                { value: 'custom', label: 'Personalizado' },
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => handlePresetChange(option.value as DatePreset)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${preset === option.value
                                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom Date Inputs */}
                    {preset === 'custom' && (
                        <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                            <div>
                                <label className="text-xs font-medium text-slate-600 mb-1 block">Fecha Inicio</label>
                                <input
                                    type="date"
                                    value={customStart}
                                    onChange={(e) => setCustomStart(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-600 mb-1 block">Fecha Fin</label>
                                <input
                                    type="date"
                                    value={customEnd}
                                    onChange={(e) => setCustomEnd(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                />
                            </div>
                            <button
                                onClick={handleApplyCustom}
                                className="col-span-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                            >
                                Aplicar Rango
                            </button>
                        </div>
                    )}

                    {/* View Mode */}
                    <div>
                        <label className="text-sm font-semibold text-slate-700 mb-2 block">Vista</label>
                        <div className="flex gap-2">
                            {[
                                { value: 'daily', label: 'Diaria' },
                                { value: 'weekly', label: 'Semanal' },
                                { value: 'monthly', label: 'Mensual' },
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => {
                                        setViewMode(option.value as ViewMode);
                                        const range = getDateRangeFromPreset(preset);
                                        applyChanges(range.start, range.end, option.value as ViewMode, comparisonMode);
                                    }}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === option.value
                                            ? 'bg-purple-600 text-white shadow-md'
                                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Comparison Mode */}
                    <div>
                        <label className="text-sm font-semibold text-slate-700 mb-2 block">Comparar con</label>
                        <div className="flex gap-2">
                            {[
                                { value: 'none', label: 'Sin comparar' },
                                { value: 'previousPeriod', label: 'Periodo anterior' },
                                { value: 'custom', label: 'Periodo personalizado' },
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => {
                                        setComparisonMode(option.value as ComparisonMode);
                                        const range = getDateRangeFromPreset(preset);
                                        applyChanges(range.start, range.end, viewMode, option.value as ComparisonMode);
                                    }}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${comparisonMode === option.value
                                            ? 'bg-pink-600 text-white shadow-md'
                                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom Comparison Dates */}
                    {comparisonMode === 'custom' && (
                        <div className="grid grid-cols-2 gap-4 p-4 bg-pink-50 rounded-lg">
                            <div>
                                <label className="text-xs font-medium text-slate-600 mb-1 block">Comparación Inicio</label>
                                <input
                                    type="date"
                                    value={comparisonStart}
                                    onChange={(e) => setComparisonStart(e.target.value)}
                                    className="w-full px-3 py-2 border border-pink-200 rounded-lg text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-600 mb-1 block">Comparación Fin</label>
                                <input
                                    type="date"
                                    value={comparisonEnd}
                                    onChange={(e) => setComparisonEnd(e.target.value)}
                                    className="w-full px-3 py-2 border border-pink-200 rounded-lg text-sm"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
