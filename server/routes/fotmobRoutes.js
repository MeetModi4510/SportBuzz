import express from 'express';
import { getFotmobTeam, getFotmobLeague, targetTeams } from '../services/fotmobScraper.js';

const router = express.Router();

// Get all mapped teams
router.get('/mapped-teams', (req, res) => {
  res.json({ success: true, data: targetTeams });
});

// Get team data by ID or Name
router.get('/team/:identifier', async (req, res) => {
  try {
    const identifier = req.params.identifier;
    let teamId = parseInt(identifier);

    // If string name passed, resolve to ID
    if (isNaN(teamId)) {
      teamId = targetTeams[identifier];
    }

    if (!teamId) {
      return res.status(404).json({ success: false, message: 'Team ID not found or unsupported team' });
    }

    const teamData = await getFotmobTeam(teamId);
    
    if (teamData) {
      res.json({ success: true, data: teamData });
    } else {
      res.status(500).json({ success: false, message: 'Failed to fetch team data' });
    }
  } catch (error) {
    console.error('FotMob Route Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get league data by ID
router.get('/league/:id', async (req, res) => {
  try {
    const leagueId = parseInt(req.params.id);
    if (isNaN(leagueId)) {
      return res.status(400).json({ success: false, message: 'Invalid league ID' });
    }

    const leagueData = await getFotmobLeague(leagueId);
    
    if (leagueData) {
      res.json({ success: true, data: leagueData });
    } else {
      res.status(500).json({ success: false, message: 'Failed to fetch league data' });
    }
  } catch (error) {
    console.error('FotMob League Route Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
