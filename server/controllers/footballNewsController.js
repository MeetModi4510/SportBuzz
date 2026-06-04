import asyncHandler from 'express-async-handler';
import FootballNews from '../models/FootballNews.js';
import FootballMatch from '../models/FootballMatch.js';
import { 
    generateMatchReportHeadline, 
    generateMatchReportContent,
    generateMilestoneNews 
} from '../utils/footballNewsGenerator.js';

// @desc    Get news for a specific tournament
// @route   GET /api/football/tournaments/:id/news
export const getTournamentNews = asyncHandler(async (req, res) => {
    const news = await FootballNews.find({ tournamentId: req.params.id })
        .sort({ createdAt: -1 })
        .limit(20);
    
    res.json({ success: true, data: news });
});

/**
 * Internal helper to create news from a finalized match
 */
export const createMatchReportNews = async (matchId) => {
    try {
        const match = await FootballMatch.findById(matchId)
            .populate('homeTeam')
            .populate('awayTeam');
        
        if (!match || match.status !== 'Completed') return;

        // Check if report already exists
        const existing = await FootballNews.findOne({ matchId, type: 'MatchReport' });
        if (existing) return;

        const title = generateMatchReportHeadline(match);
        const content = generateMatchReportContent(match);

        await FootballNews.create({
            tournamentId: match.tournamentId,
            matchId: match._id,
            title,
            content,
            type: 'MatchReport',
            generatingEvent: 'FinalizeMatch'
        });
        
        console.log(`[NEWSROOM] Generated match report for ${matchId}`);
    } catch (error) {
        console.error('[NEWSROOM] Error generating match report:', error);
    }
};

/**
 * Internal helper to create news from match events (e.g. Hat-trick)
 */
export const createEventNews = async (matchId, player, eventType) => {
    try {
        const match = await FootballMatch.findById(matchId)
            .populate('homeTeam')
            .populate('awayTeam');
            
        if (!match) return;

        const newsData = generateMilestoneNews(match, player, eventType);
        if (!newsData) return;

        // Prevent duplicate milestone news
        const slug = `${matchId}_${player}_${eventType}`;
        const existing = await FootballNews.findOne({ generatingEvent: slug });
        if (existing) return;

        await FootballNews.create({
            tournamentId: match.tournamentId,
            matchId: match._id,
            title: newsData.title,
            content: newsData.content,
            type: 'Milestone',
            generatingEvent: slug
        });

        console.log(`[NEWSROOM] Generated milestone news: ${eventType} for ${player}`);
    } catch (error) {
        console.error('[NEWSROOM] Error generating milestone news:', error);
    }
};
