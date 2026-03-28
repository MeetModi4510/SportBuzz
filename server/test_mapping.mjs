import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

// Import the actual service to test the real mapping path
import { cricbuzzService } from './services/cricbuzzService.js';

const AUS_ZIM_ID = '9148b8df-145f-4319-b33f-6674b69cdbb3';

async function testMapping() {
    console.log('=== TESTING ACTUAL getCricbuzzMatchId() ===\n');

    console.log('Step 1: Testing mapping...');
    const cbId = await cricbuzzService.getCricbuzzMatchId(AUS_ZIM_ID);
    console.log('Cricbuzz ID result:', cbId);

    if (!cbId) {
        console.log('\n*** MAPPING FAILED — This is why scorecard/lineups/commentary do not load ***');
        console.log('The mapping function could not find the Cricbuzz equivalent.');
        return;
    }

    console.log('\nStep 2: Testing scorecard...');
    const scorecard = await cricbuzzService.getScorecard(AUS_ZIM_ID);
    console.log('Scorecard error:', scorecard?.error);
    console.log('Scorecard data present:', !!scorecard?.data);
    if (scorecard?.data?.innings) {
        console.log('Innings count:', scorecard.data.innings.length);
        scorecard.data.innings.forEach((inn, i) => {
            console.log(`  Inn ${i + 1}: ${inn.teamName} ${inn.score}/${inn.wickets} (${inn.overs} ov)`);
        });
    }
}

testMapping().catch(e => console.error('Error:', e.message));
