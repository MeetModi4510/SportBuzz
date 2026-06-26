import { getTeamAnalytics } from './services/cricsheetService.js';
import fs from 'fs';

async function rebuild() {
    fs.rmSync('cache/cricsheet',{recursive:true,force:true});
    console.log("Cleared cache. Rebuilding...");
    await getTeamAnalytics('india-2', 'test');
    console.log("Done!");
}
rebuild();
