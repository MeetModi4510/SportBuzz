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

export const formatOversText = (oversStr?: string | number) => {
  if (!oversStr) return '';
  let val = String(oversStr).replace(/[()]/g, '').trim();
  // Fix .6 to the next whole number (e.g. 76.6 -> 77)
  if (val.includes('.6')) {
     val = val.replace(/(\d+)\.6/, (match, p1) => String(parseInt(p1) + 1));
  }
  if (!val.toLowerCase().includes('ov')) {
     val = `${val} ov`;
  }
  return val;
};

export const formatScoreString = (scoreStr?: string) => {
  if (!scoreStr) return scoreStr;
  return scoreStr.replace(/(\d+)\.6\b/g, (match, p1) => String(parseInt(p1) + 1));
};
