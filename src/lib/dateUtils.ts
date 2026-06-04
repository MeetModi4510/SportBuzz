
/**
 * Parses a date string as UTC/GMT
 * Handles cases where 'Z' is missing from ISO-like strings
 */
export const parseGMT = (dateInput: string | undefined, defaultToNow = true): Date => {
    if (!dateInput) return defaultToNow ? new Date() : new Date(0);
    let cleanStr = dateInput.trim();

    // If it matches "YYYY-MM-DD HH:mm:ss", replace space with T
    if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}$/.test(cleanStr)) {
        cleanStr = cleanStr.replace(' ', 'T');
    }

    // If it doesn't have timezone info (Z or +HH:mm), assume UTC and append Z
    if (!cleanStr.endsWith('Z') && !cleanStr.match(/[+-]\d{2}:?\d{2}$/)) {
        cleanStr += 'Z';
    }

    return new Date(cleanStr);
};

/**
 * Helper to format date in IST (Indian Standard Time)
 * Converts any UTC/GMT time to Asia/Kolkata timezone
 * Forces input strings to be treated as UTC by appending 'Z' if missing
 */
export const formatToIST = (dateInput: string | Date | undefined, formatType: 'full' | 'time' | 'date' = 'full'): string => {
    if (!dateInput) return '';

    let date: Date;
    if (typeof dateInput === 'string') {
        date = parseGMT(dateInput);
    } else {
        date = dateInput;
    }

    // Check validity
    if (isNaN(date.getTime())) return '';

    const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Kolkata',
        hour12: true,
    };

    if (formatType === 'full') {
        options.day = 'numeric';
        options.month = 'short';
        options.hour = 'numeric';
        options.minute = '2-digit';
    } else if (formatType === 'time') {
        options.hour = 'numeric';
        options.minute = '2-digit';
    } else if (formatType === 'date') {
        options.day = 'numeric';
        options.month = 'short';
        options.year = 'numeric';
    }

    return new Intl.DateTimeFormat('en-IN', options).format(date) + ' IST';
};
