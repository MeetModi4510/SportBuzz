import express from 'express';
import { getFotmobTeam, targetTeams } from '../services/fotmobScraper.js';

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

export default router;
