/**
 * Cricket Net Run Rate (NRR) Utilities
 * Handles complex NRR calculations for qualification scenarios.
 */

export interface TeamNRRStats {
    runsScored: number;
    oversFaced: number;
    runsConceded: number;
    oversBowled: number;
}

/** 
 * Convert cricket overs notation (e.g., 9.4) to decimal (9.666) 
 */
export const oversToDecimal = (ov: number): number => {
    if (!ov || ov === 0) return 0;
    const full = Math.floor(ov);
    const balls = Math.round((ov - full) * 10);
    return full + (balls / 6);
};

/**
 * Convert decimal overs (9.666) back to cricket notation (9.4)
 */
export const decimalToOvers = (decimal: number): string => {
    const fullOvers = Math.floor(decimal);
    const balls = Math.round((decimal - fullOvers) * 6);
    return `${fullOvers}.${balls}`;
};

/**
 * Calculates the required margin to overtake an opponent in NRR.
 * 
 * @param teamA Current stats of the team seeking qualification
 * @param teamB Current stats of the opponent to overtake
 * @param target The target in the current match (if applicable)
 * @param maxOvers Maximum overs allowed in the match (e.g., 20)
 */
export const calculateNRRMargin = (
    teamA: TeamNRRStats,
    teamB: TeamNRRStats,
    target: number,
    maxOvers: number
) => {
    // Current NRR Difference, guarding against division by zero (0 overs)
    const currentNRR_A = (teamA.oversFaced > 0 ? teamA.runsScored / teamA.oversFaced : 0) - (teamA.oversBowled > 0 ? teamA.runsConceded / teamA.oversBowled : 0);
    const currentNRR_B = (teamB.oversFaced > 0 ? teamB.runsScored / teamB.oversFaced : 0) - (teamB.oversBowled > 0 ? teamB.runsConceded / teamB.oversBowled : 0);

    // Scenario 1: Team A is Chasing (Opponent scored 'target' runs)
    // We need (TeamA.RS + Target) / (TeamA.OF + RequiredOvers) - (TeamA.RC + Target) / (TeamA.OB + maxOvers) > OpponentNRR
    let chaseOvers = 0;
    let achievable = false;
    for (let o = 0.1; o <= maxOvers; o += 0.1) {
        const currentOver = parseFloat(o.toFixed(1));
        const decimalPart = currentOver - Math.floor(currentOver);
        if (decimalPart > 0.61) continue;

        const decOvers = oversToDecimal(currentOver);

        // Calculate new stats assuming Team A conceded 'target' in 'maxOvers' and chases in 'decOvers'
        const newRunsScored = teamA.runsScored + target;
        const newOversFaced = teamA.oversFaced + decOvers;
        const newRunsConceded = teamA.runsConceded + target;
        const newOversBowled = teamA.oversBowled + maxOvers;

        const newNRR = (newRunsScored / newOversFaced) - (newRunsConceded / newOversBowled);

        if (newNRR > currentNRR_B) {
            chaseOvers = currentOver;
            achievable = true;
        } else {
            break;
        }
    }

    // Scenario 2: Team A is Defending (Team A scored 'target' runs)
    // Find the maximum runs Team A can concede in 'maxOvers' to stays above OpponentNRR.
    let restrictRuns = -1; // -1 means impossible
    const teamA_bat_OF = maxOvers; // Assume they batted full quota (or all out)
    const teamA_bowl_OB = maxOvers; // Assume they bowl full quota (or opponent all out)

    for (let r = 0; r <= target; r++) {
        const newRunsScored = teamA.runsScored + target;
        const newOversFaced = teamA.oversFaced + teamA_bat_OF;
        const newRunsConceded = teamA.runsConceded + r;
        const newOversBowled = teamA.oversBowled + teamA_bowl_OB;

        const newNRR = (newRunsScored / newOversFaced) - (newRunsConceded / newOversBowled);

        if (newNRR > currentNRR_B) {
            restrictRuns = r;
        } else {
            // If even conceding 0 runs doesn't help, it's impossible (loop ends or breaks)
            if (r === 0) break;
            break;
        }
    }

    let finalChaseStr: string | null = null;
    if (achievable && chaseOvers > 0) {
        // Since we bounded the loop by maxOvers, chaseOvers will never exceed maxOvers.
        // Convert back using the utility to ensure it formats properly
        finalChaseStr = decimalToOvers(oversToDecimal(chaseOvers));
        // If the required chase overs is exactly the max overs (or very close), any win is sufficient.
        if (chaseOvers >= maxOvers - 0.1) {
            finalChaseStr = `${maxOvers} (Any Win)`;
        }
    }

    return {
        chaseBeforeOver: finalChaseStr,
        restrictToRuns: restrictRuns >= 0 ? restrictRuns : null,
        nrrGap: currentNRR_B - currentNRR_A
    };
};
