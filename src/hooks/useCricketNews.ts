import { useState, useEffect } from 'react';
import { cacheManager } from '../utils/football/cacheManager'; // Reusing cacheManager

const API_BASE = import.meta.env.PROD
  ? 'https://sportbuzz-backend.onrender.com'
  : (import.meta.env.PROD ? '' : 'http://localhost:5000');

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
    const cacheKey = 'cricketNewsList';

    const cachedNews = cacheManager.get<CricketNewsItem[]>(cacheKey);
    if (cachedNews && cachedNews.length > 0) {
      setNews(cachedNews);
      setLoading(false);
      return;
    }

    const fetchNews = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/cricket/news`);
        const json = await res.json();
        if (!cancelled) {
          const data = json.data || [];
          setNews(data);
          setError(json.error || null);
          if (!json.error && data.length > 0) {
            cacheManager.set(cacheKey, data, 30); // 30 minutes cache
          }
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

export function useCricketNewsDetail(articleId: string | null) {
  const [content, setContent] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!articleId) {
      setContent([]);
      return;
    }

    let cancelled = false;
    const cacheKey = `cricketNewsDetail:${articleId}`;

    const cachedDetail = cacheManager.get<string[]>(cacheKey);
    if (cachedDetail && cachedDetail.length > 0) {
      setContent(cachedDetail);
      return;
    }

    setLoading(true);
    setError(null);

    const fetchDetail = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/cricket/news/${articleId}`);
        const json = await res.json();
        if (!cancelled) {
          const data = json.data || [];
          setContent(data);
          setError(json.error || null);
          if (!json.error && data.length > 0) {
            cacheManager.set(cacheKey, data, 30); // 30 minutes cache
          }
        }
      } catch (e: any) {
        if (!cancelled) setError('Failed to load article detail');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchDetail();
    return () => { cancelled = true; };
  }, [articleId]);

  return { content, loading, error };
}
