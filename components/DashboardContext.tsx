"use client";

import { createContext, useContext } from 'react';

interface DashboardContextType {
    userEmail: string | null;
}

const DashboardContext = createContext<DashboardContextType>({ userEmail: null });

export function DashboardProvider({ children, userEmail }: { children: React.ReactNode; userEmail: string | null }) {
    return (
        <DashboardContext.Provider value={{ userEmail }}>
            {children}
        </DashboardContext.Provider>
    );
}

export function useDashboard() {
    return useContext(DashboardContext);
}
