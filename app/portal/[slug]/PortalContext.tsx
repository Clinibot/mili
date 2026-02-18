"use client";

import { createContext, useContext, ReactNode } from 'react';

interface Client {
    id: string;
    name: string;
    phone_ia: string;
    contact_name: string;
    balance?: number;
    calendar_connected: boolean;
    notification_preferences?: any;
}

interface PortalContextType {
    client: Client | null;
    slug: string;
}

const PortalContext = createContext<PortalContextType | undefined>(undefined);

export function PortalProvider({ children, value }: { children: ReactNode, value: PortalContextType }) {
    return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}

export function usePortal() {
    const context = useContext(PortalContext);
    if (context === undefined) {
        throw new Error('usePortal must be used within a PortalProvider');
    }
    return context;
}
