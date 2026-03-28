import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function getTeamAcronym(name: string): string {
    if (!name) return "";
    
    // If it's a single word and 3 chars or less, it's likely already an acronym or small name
    if (!name.includes(" ") && name.length <= 3) {
        return name.toUpperCase();
    }

    const words = name.split(/\s+/).filter(word => {
        const lower = word.toLowerCase();
        return !["of", "and", "the", "&", "vs", "a", "an"].includes(lower);
    });

    if (words.length > 1) {
        return words.map(w => w[0]).join("").toUpperCase();
    }
    
    // Fallback for single long word: first 3 letters
    return name.slice(0, 3).toUpperCase();
}

