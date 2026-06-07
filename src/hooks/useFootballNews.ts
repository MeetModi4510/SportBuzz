import { useState, useEffect } from 'react';
import api from '@/services/api';

export interface FootballNewsItem {
  id: string;
  sport: 'football';
  headline: string;
  isLive: boolean;
  timestamp: string;
  imageUrl?: string;
  sourceStr?: string;
  sourceIconUrl?: string;
  pageUrl?: string;
}

function timeAgo(dateStr: string) {
  const diff = Math.max(0, Date.now() - new Date(dateStr).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function useFootballNews() {
  const [news, setNews] = useState<FootballNewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchNews = async () => {
      try {
        const res = await api.get('/football/live-news') as any;
        if (res?.success && Array.isArray(res.data)) {
          if (mounted) {
            const formatted = res.data.map((item: any) => ({
              id: item.id || Math.random().toString(),
              sport: 'football',
              headline: item.title || item.headline || 'Football Update',
              snippet: 'Click to read full story on SportsBuzz Football.',
              isLive: true,
              timestamp: item.gmtTime ? timeAgo(item.gmtTime) : 'Just now',
              imageUrl: item.imageUrl,
              sourceStr: item.sourceStr,
              sourceIconUrl: item.sourceIconUrl,
              pageUrl: item.page?.url
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

    // Poll every 1 hour (3600000ms) to sync with backend cache
    const interval = setInterval(fetchNews, 3600000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return { news, loading };
}
