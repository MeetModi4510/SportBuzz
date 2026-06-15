import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { cacheManager } from '../../utils/football/cacheManager';
import { footballApiClient } from '../../services/football/apiClient';

interface PerformanceLabData {
  predictions?: any;
  statistics?: any;
  players?: any;
}

const API_SPORTS_BASE = '/proxy'; // Our backend proxy route

// A helper to normalize team names for rough matching
const normalizeName = (name: string) => name.toLowerCase().replace(/[^a-z0-z]/g, '');

export const usePerformanceLab = (
  espnMatchId: string,
  matchDate: string,
  homeTeamName: string,
  awayTeamName: string,
  matchStatus: string, // e.g. "upcoming", "live", "finished"
  enabled: boolean = false
) => {
  const [data, setData] = useState<PerformanceLabData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState<string>('');

  const fetchInProgress = useRef(false);

  useEffect(() => {
    if (!enabled || !espnMatchId || !homeTeamName || !awayTeamName || !matchDate) return;

    const cacheKey = `perf_lab_${espnMatchId}`;
    const cached = cacheManager.get<PerformanceLabData>(cacheKey);

    if (cached) {
      setData(cached);
      return;
    }

    if (fetchInProgress.current) return;

    const fetchSequentialData = async () => {
      fetchInProgress.current = true;
      setIsLoading(true);
      setError(null);
      setLoadingStep('Locating match data...');

      try {
        // Step 1: Find the API-Sports Fixture ID by querying the date
        const dateStr = new Date(matchDate).toISOString().split('T')[0];
        const fixturesRes = await footballApiClient.get(`${API_SPORTS_BASE}/fixtures`, {
          params: { date: dateStr }
        });

        const fixtures = fixturesRes.data?.response || [];
        
        // Find matching fixture
        const homeNorm = normalizeName(homeTeamName);
        const awayNorm = normalizeName(awayTeamName);
        
        let fixtureId = null;
        for (const f of fixtures) {
            const fHome = normalizeName(f.teams.home.name);
            const fAway = normalizeName(f.teams.away.name);
            // Simple substring inclusion match because ESPN and API-Sports name teams differently
            if ((fHome.includes(homeNorm) || homeNorm.includes(fHome)) && 
                (fAway.includes(awayNorm) || awayNorm.includes(fAway))) {
                fixtureId = f.fixture.id;
                break;
            }
        }

        if (!fixtureId) {
            throw new Error(`Could not find analytical data for ${homeTeamName} vs ${awayTeamName}`);
        }

        const resultData: PerformanceLabData = {};

        // Helper for sequential delay
        const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

        // Step 2: Fetch Predictions (Available for all match statuses)
        setLoadingStep('Analyzing predictions & form...');
        const predRes = await footballApiClient.get(`${API_SPORTS_BASE}/predictions`, { params: { fixture: fixtureId } });
        resultData.predictions = predRes.data?.response?.[0] || null;
        
        if (matchStatus === 'live' || matchStatus === 'finished') {
            await delay(500); // Prevent rate limiting
            
            // Step 3: Fetch Statistics
            setLoadingStep('Gathering team statistics...');
            const statsRes = await footballApiClient.get(`${API_SPORTS_BASE}/fixtures/statistics`, { params: { fixture: fixtureId } });
            resultData.statistics = statsRes.data?.response || null;

            await delay(500);

            // Step 4: Fetch Player Stats
            setLoadingStep('Processing player ratings...');
            const playersRes = await footballApiClient.get(`${API_SPORTS_BASE}/fixtures/players`, { params: { fixture: fixtureId } });
            resultData.players = playersRes.data?.response || null;
        }

        setData(resultData);
        
        // Cache TTL based on status
        const ttlMins = matchStatus === 'live' ? 1 : 15;
        cacheManager.set(cacheKey, resultData, ttlMins);

      } catch (err: any) {
        console.error('Performance Lab Error:', err);
        setError(err.message || 'Failed to load advanced performance data');
      } finally {
        setIsLoading(false);
        setLoadingStep('');
        fetchInProgress.current = false;
      }
    };

    fetchSequentialData();

  }, [espnMatchId, enabled, homeTeamName, awayTeamName, matchDate, matchStatus]);

  return { data, isLoading, error, loadingStep };
};
