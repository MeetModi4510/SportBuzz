import { getTeamAnalytics } from './services/cricsheetService.js';
import fs from 'fs';

async function rebuild() {
    fs.rmSync('cache/cricsheet',{recursive:true,force:true});
    console.log("Cleared cache. Rebuilding...");
    await getTeamAnalytics('india-2', 'test');
    await getTeamAnalytics('india-2', 'odi');
    await getTeamAnalytics('india-2', 't20');
    console.log("Done!");
}
rebuild();
