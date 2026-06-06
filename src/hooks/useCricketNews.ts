import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.PROD
  ? 'https://sportbuzz-backend.onrender.com'
  : 'http://localhost:5000';

export interface CricketNewsItem {
  id: string;
  title: string;
  headline: string;
  snippet: string;
  timestamp: string;
  context: string;
  imageId: string | null;
  source: string;
  sport: 'cricket';
}

interface UseCricketNewsResult {
  news: CricketNewsItem[];
  loading: boolean;
  error: string | null;
}

export function useCricketNews(): UseCricketNewsResult {
  const [news, setNews] = useState<CricketNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchNews = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/cricket/news`);
        const json = await res.json();
        if (!cancelled) {
          setNews(json.data || []);
          setError(json.error || null);
        }
      } catch (e: any) {
        if (!cancelled) setError('Failed to load news');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchNews();
    return () => { cancelled = true; };
  }, []);

  return { news, loading, error };
}
