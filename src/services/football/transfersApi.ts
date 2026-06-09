import axios from 'axios';
import { LatestTransfersResponse } from '../../types/football/transfers';

const TRANSFERS_API_KEY = import.meta.env.VITE_TRANSFERS_API_KEY || import.meta.env.VITE_FOOTBALL_TRANSFERS_API_KEY || 'eb749f7649msh0459c2bebc6852fp1cd967jsn192331cca5eb';
const TRANSFERS_API_HOST = 'free-api-live-football-data.p.rapidapi.com';

const transfersApiClient = axios.create({
  baseURL: `https://${TRANSFERS_API_HOST}`,
  headers: {
    'x-rapidapi-host': TRANSFERS_API_HOST,
    'x-rapidapi-key': TRANSFERS_API_KEY,
    'Content-Type': 'application/json'
  },
});

export const transfersApi = {
  getLatestTransfers: async (): Promise<{ transfers: any[] }> => {
    try {
      const [allRes, marketRes] = await Promise.all([
        transfersApiClient.get('/football-get-all-transfers?page=1'),
        transfersApiClient.get('/football-get-market-value-transfers?page=1')
      ]);
      
      const allTransfers = allRes.data?.response?.transfers || [];
      const marketTransfers = marketRes.data?.response?.transfers || [];
      
      const combined = [...allTransfers, ...marketTransfers];
      
      // Deduplicate by name and toClub
      const uniqueTransfers = Array.from(new Map(combined.map(t => [`${t.name}-${t.toClub}`, t])).values());
      
      return { transfers: uniqueTransfers };
    } catch (error) {
      console.error('Failed to fetch transfers', error);
      throw error;
    }
  }
};
