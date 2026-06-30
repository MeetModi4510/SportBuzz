import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import util from 'util';
import BDFutbolCache from '../models/BDFutbolCache.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execPromise = util.promisify(exec);

// Detect if we're on Linux (Render) or Windows (local dev)
const isLinux = process.platform === 'linux';

// Build the correct python command for the platform
function buildPythonCommand(scriptPath, stadiumId) {
    if (isLinux) {
        // On Linux (Render): use xvfb-run to create a virtual display
        // Chrome renders into the virtual framebuffer - completely invisible
        return `xvfb-run --auto-servernum --server-args="-screen 0 1920x1080x24" python3 "${scriptPath}" ${stadiumId}`;
    } else {
        // On Windows (local dev): use the win32 hide approach
        return `python "${scriptPath}" ${stadiumId}`;
    }
}

export async function scrapeBDFutbolVenue(id) {
    // ── 1. Check MongoDB cache first ────────────────────────────────────────────
    try {
        const cached = await BDFutbolCache.findOne({ stadiumId: id });
        if (cached) {
            console.log(`[BDFutbol] ✅ Returning MongoDB cached data for venue ${id} (no Chrome opened)`);
            return cached.data;
        }
    } catch (dbErr) {
        // If DB check fails, continue to live scrape - don't crash
        console.warn('[BDFutbol] MongoDB cache check failed, falling back to live scrape:', dbErr.message);
    }

    // ── 2. Cache miss: scrape live with Python ───────────────────────────────────
    console.log(`[BDFutbol] 🌐 Cache miss for venue ${id}. Starting Chrome scrape...`);
    const scriptPath = path.join(__dirname, '..', 'bdfutbol_uc_scraper.py');
    const command = buildPythonCommand(scriptPath, id);
    
    let statsObj;
    try {
        const { stdout, stderr } = await execPromise(command, { timeout: 60000 });
        
        // Parse JSON output from Python
        const trimmed = stdout.trim();
        const jsonLine = trimmed.split('\n').find(line => {
            try { JSON.parse(line); return true; } catch { return false; }
        });
        
        if (!jsonLine) {
            console.error('[BDFutbol] Python stdout:', stdout);
            console.error('[BDFutbol] Python stderr:', stderr);
            throw new Error('No valid JSON output from Python scraper');
        }
        
        statsObj = JSON.parse(jsonLine);
        
        if (statsObj.error) {
            throw new Error('Python scraper error: ' + statsObj.error);
        }
        
        // Prevent empty arrays from the scraper from overwriting hardcoded static data
        if (Array.isArray(statsObj.historicalNames) && statsObj.historicalNames.length === 0) {
            delete statsObj.historicalNames;
        }
        if (Array.isArray(statsObj.seasonsList) && statsObj.seasonsList.length === 0) {
            delete statsObj.seasonsList;
        }
        if (Array.isArray(statsObj.visitingTeams) && statsObj.visitingTeams.length === 0) {
            delete statsObj.visitingTeams;
        }
    } catch (e) {
        console.error('[BDFutbol] Scraper error:', e.message);
        throw e;
    }

    // ── 3. Save to MongoDB (TTL index auto-deletes after 24h) ───────────────────
    try {
        await BDFutbolCache.findOneAndUpdate(
            { stadiumId: id },
            { stadiumId: id, data: statsObj, createdAt: new Date() },
            { upsert: true, new: true }
        );
        console.log(`[BDFutbol] 💾 Saved data for venue ${id} to MongoDB (expires in 24h)`);
    } catch (dbErr) {
        // Saving to cache failed - still return data to user, just won't cache
        console.warn('[BDFutbol] Failed to save to MongoDB cache:', dbErr.message);
    }

    return statsObj;
}
