
// This is a standalone verification script to test the aggregation logic
// It mocks the database structure and runs the logic from the controller

const mockTournament = {
    _id: 't1',
    teams: [
        { _id: 'team1', name: 'Arsenal' },
        { _id: 'team2', name: 'Chelsea' }
    ]
};

const mockMatches = [
    {
        _id: 'm1',
        homeTeam: 'team1',
        awayTeam: 'team2',
        status: 'Completed',
        score: { home: 2, away: 1 },
        events: [
            { type: 'Goal', player: 'Saka', team: 'team1', minute: 10 },
            { type: 'Goal', player: 'Odegaard', team: 'team1', minute: 25, assister: 'Saka' },
            { type: 'Goal', player: 'Palmer', team: 'team2', minute: 45 },
            { type: 'YellowCard', player: 'Saka', team: 'team1', minute: 60 }
        ]
    },
    {
        _id: 'm2',
        homeTeam: 'team1',
        awayTeam: 'team2',
        status: 'Paused',
        score: { home: 1, away: 0 },
        events: [
            { type: 'goal', player: 'Saka', team: 'team1', minute: 5 } // Test case-insensitive
        ]
    }
];

// Logic extracted from the controller
const calculateStats = (tournament, matches) => {
    const teamMap = {};
    tournament.teams.forEach(t => teamMap[t._id.toString()] = t.name);

    const playerStats = {};
    const getPlayer = (name, teamId) => {
        if (!name || name === 'Unknown Player' || name === 'Unknown') return null;
        
        const tid = teamId?.toString();
        const key = `${name}_${tid || 'unknown'}`;
        
        if (!playerStats[key]) {
            playerStats[key] = {
                name,
                teamId: tid,
                teamName: teamMap[tid] || 'Unknown',
                goals: 0,
                assists: 0,
                yellowCards: 0,
                redCards: 0,
                saves: 0
            };
        }
        return playerStats[key];
    };

    matches.forEach(match => {
        match.events.forEach(event => {
            const typeLower = event.type?.toLowerCase();
            
            if (event.player) {
                const p = getPlayer(event.player, event.team);
                if (p) {
                    if (typeLower === 'goal') p.goals++;
                    if (typeLower === 'yellowcard') p.yellowCards++;
                    if (typeLower === 'redcard') p.redCards++;
                    if (typeLower === 'save') p.saves++;
                }
            }
            
            if (event.assister && event.assister !== 'No Assist' && event.assister !== 'Unknown Player' && event.assister !== 'Unknown') {
                const a = getPlayer(event.assister, event.team);
                if (a) a.assists++;
            }
        });
    });

    const statsList = Object.values(playerStats);

    return {
        topScorers: statsList.filter(p => p.goals > 0).sort((a, b) => b.goals - a.goals),
        topAssisters: statsList.filter(p => p.assists > 0).sort((a, b) => b.assists - a.assists)
    };
};

const result = calculateStats(mockTournament, mockMatches);

console.log('--- VERIFICATION RESULTS ---');
console.log('Top Scorers:', JSON.stringify(result.topScorers, null, 2));
console.log('Top Assisters:', JSON.stringify(result.topAssisters, null, 2));

// Assertions
const saka = result.topScorers.find(p => p.name === 'Saka');
if (saka && saka.goals === 3) {
    console.log('SUCCESS: Saka has 3 goals (including paused and case-insensitive goal).');
} else {
    console.error('FAILURE: Saka goal count mismatch.', saka ? saka.goals : 'not found');
}

if (result.topAssisters.length > 0 && result.topAssisters[0].name === 'Saka') {
    console.log('SUCCESS: Saka has 1 assist.');
} else {
    console.error('FAILURE: Saka assist mismatch.');
}
