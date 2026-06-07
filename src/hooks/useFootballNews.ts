import { useState, useEffect } from 'react';
import api from '@/services/api';

export interface FootballNewsItem {
  id: string;
  sport: 'football';
  headline: string;
  isLive: boolean;
  timestamp: string;
}

export function useFootballNews() {
  const [news, setNews] = useState<FootballNewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchNews = async () => {
      try {
        // Note: api.ts response interceptor auto-unwraps response.data,
        // so `res` is already the parsed JSON body: { success: true, data: [...] }
        const res = await api.get('/football/live-news') as any;
        if (res?.success && Array.isArray(res.data)) {
          if (mounted) {
            // Transform the rapidapi response format
            const formatted = res.data.map((item: any) => ({
              id: item.id,
              sport: 'football',
              headline: item.headLine || item.headline || 'Football Update',
              snippet: 'Click to read full story on SportsBuzz Football.',
              isLive: true,
              timestamp: 'Just now'
            }));
            setNews(formatted);
          }
        }
      } catch (err) {
        console.error('Failed to fetch live football news:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchNews();

    // Poll every 10 minutes (600000ms) to sync with backend cache
    const interval = setInterval(fetchNews, 600000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return { news, loading };
}
