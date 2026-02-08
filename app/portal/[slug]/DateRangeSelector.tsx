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
        <div className="flex bg-surface-dark border border-white/5 rounded-2xl p-1 shadow-2xl">
            {[
                { value: 'last7days', label: '7D' },
                { value: 'last30days', label: '30D' },
                { value: 'thisMonth', label: 'MES' },
            ].map((option) => (
                <button
                    key={option.value}
                    onClick={() => handlePresetChange(option.value as DatePreset)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold font-mono tracking-wider transition-all duration-200 ${preset === option.value
                        ? 'bg-accent-blue text-white shadow-lg shadow-accent-blue/30 scale-105'
                        : 'text-white/40 hover:text-white hover:bg-white/5'
                        }`}
                >
                    {option.label}
                </button>
            ))}
            <div className="w-px bg-white/5 mx-2 my-2"></div>
            <button
                onClick={() => handlePresetChange('custom')}
                className={`px-4 py-2 rounded-xl text-xs font-bold font-mono tracking-wider transition-all duration-200 ${preset === 'custom'
                    ? 'bg-accent-coral text-white shadow-lg shadow-accent-coral/30 scale-105'
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                    }`}
            >
                CUSTOM
            </button>
        </div>
    );
}
