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
        <div className="flex flex-col gap-4 items-end">
            <div className="flex bg-[#0E1219] border border-[#1F2937] rounded-2xl p-1 shadow-2xl">
                {[
                    { value: 'last7days', label: '7D' },
                    { value: 'last30days', label: '30D' },
                    { value: 'thisMonth', label: 'MES' },
                ].map((option) => (
                    <button
                        key={option.value}
                        onClick={() => handlePresetChange(option.value as DatePreset)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold font-mono tracking-wider transition-all duration-200 ${preset === option.value
                            ? 'bg-[#008DCB] text-[#070A0F] shadow-lg shadow-[#008DCB]/30 scale-105'
                            : 'text-[rgba(255,255,255,0.3)] hover:text-[#E8ECF1] hover:bg-[#141A23]'
                            }`}
                    >
                        {option.label}
                    </button>
                ))}
                <div className="w-px bg-[#1F2937] mx-2 my-2"></div>
                <button
                    onClick={() => handlePresetChange('custom')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold font-mono tracking-wider transition-all duration-200 ${preset === 'custom'
                        ? 'bg-[#F78E5E] text-[#070A0F] shadow-lg shadow-[#F78E5E]/30 scale-105'
                        : 'text-[rgba(255,255,255,0.3)] hover:text-[#E8ECF1] hover:bg-[#141A23]'
                        }`}
                >
                    CUSTOM
                </button>
            </div>

            {preset === 'custom' && (
                <div className="flex items-center gap-3 bg-[#0E1219] border border-[#1F2937] p-2 rounded-2xl shadow-xl animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-2 px-3 py-1 bg-[#141A23] rounded-xl border border-[#1F2937]">
                        <span className="text-[10px] font-bold text-[rgba(255,255,255,0.3)] uppercase tracking-widest">Desde</span>
                        <input
                            type="date"
                            value={customStart}
                            onChange={(e) => setCustomStart(e.target.value)}
                            className="bg-transparent text-[#E8ECF1] text-xs font-mono focus:outline-none [color-scheme:dark]"
                        />
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-[#141A23] rounded-xl border border-[#1F2937]">
                        <span className="text-[10px] font-bold text-[rgba(255,255,255,0.3)] uppercase tracking-widest">Hasta</span>
                        <input
                            type="date"
                            value={customEnd}
                            onChange={(e) => setCustomEnd(e.target.value)}
                            className="bg-transparent text-[#E8ECF1] text-xs font-mono focus:outline-none [color-scheme:dark]"
                        />
                    </div>
                    <button
                        onClick={handleApplyCustom}
                        className="bg-[#F78E5E] hover:bg-[#F78E5E]/80 text-[#070A0F] px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95"
                    >
                        Aplicar
                    </button>
                </div>
            )}
        </div>
    );
}
