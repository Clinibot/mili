import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function sanitizeFilename(filename: string): string {
    const parts = filename.split('.');
    const ext = parts.pop() || '';
    let name = parts.join('.');

    // Basic sanitization: remove accents, spaces to underscores, remove special chars
    name = name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_.-]/g, '');

    return `${name}.${ext}`;
}
