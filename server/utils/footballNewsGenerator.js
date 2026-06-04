
/**
 * Utility to generate human-like headlines and news content from match data
 */

export const generateMatchReportHeadline = (match) => {
    const { homeTeam, awayTeam, score } = match;
    const homeName = homeTeam.name;
    const awayName = awayTeam.name;
    const homeScore = score.home;
    const awayScore = score.away;

    if (homeScore > awayScore) {
        if (homeScore - awayScore >= 3) {
            return `${homeName} Dominate ${awayName} in Statement Victory!`;
        }
        return `${homeName} Edge Past ${awayName} in Tight Encounter`;
    } else if (awayScore > homeScore) {
        if (awayScore - homeScore >= 3) {
            return `${awayName} Outclass ${homeName} with Masterful Performance`;
        }
        return `${awayName} Secure Crucial Win Against ${homeName}`;
    } else {
        if (homeScore === 0) {
            return `Goal-less Stalemate Between ${homeName} and ${awayName}`;
        }
        return `Points Shared as ${homeName} and ${awayName} Draw ${homeScore}-${awayScore}`;
    }
};

export const generateMatchReportContent = (match) => {
    const { homeTeam, awayTeam, score, events, venue } = match;
    const homeName = homeTeam.name;
    const awayName = awayTeam.name;
    const homeScore = score.home;
    const awayScore = score.away;

    let content = `The match between ${homeName} and ${awayName} at ${venue || 'the stadium'} concluded with a final score of ${homeScore}-${awayScore}. `;

    const goals = events.filter(e => e.type === 'Goal');
    if (goals.length > 0) {
        content += "Key moments included goals from ";
        const goalDescriptions = goals.map(g => `${g.player} (${g.minute}')`);
        content += goalDescriptions.slice(0, -1).join(", ") + (goalDescriptions.length > 1 ? " and " : "") + goalDescriptions.slice(-1) + ". ";
    }

    if (homeScore > awayScore) {
        content += `${homeName} showed tactical superiority throughout the match, securing all three points. `;
    } else if (awayScore > homeScore) {
        content += `A spirited performance from ${awayName} saw them walk away with a well-deserved victory. `;
    } else {
        content += "Both teams fought hard, but neither could find the winning edge today. ";
    }

    return content;
};

export const generateMilestoneNews = (match, player, type) => {
    const teamName = String(match.homeTeam._id) === String(match.homeTeam) ? 'Home Team' : (match.homeTeam.name || 'their team');
    
    if (type === 'HatTrick') {
        return {
            title: `Unstoppable! ${player} Nets a Hat-trick!`,
            content: `In an extraordinary display of finishing, ${player} has scored three goals today. The fans are in awe of this masterclass performance.`
        };
    }

    if (type === 'LastMinuteWinner') {
        return {
            title: `Late Drama! ${player} Wins it at the Death!`,
            content: `Heartbreak for the opposition as ${player} scores in the final moments to snatch victory for their side. A moment that will be remembered for years!`
        };
    }

    return null;
};
