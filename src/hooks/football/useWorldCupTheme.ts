import { useState, useEffect } from 'react';

export const useWorldCupTheme = () => {
  const [isWorldCup, setIsWorldCup] = useState(false);

  useEffect(() => {
    // Check if the current date is before July 20, 2026 midnight UTC
    const checkDate = () => {
      const now = new Date();
      const endDate = new Date('2026-07-20T23:59:59Z');
      setIsWorldCup(now <= endDate);
    };

    checkDate();
    // Optional: check periodically if the app is open for a long time
    const interval = setInterval(checkDate, 1000 * 60 * 60); // Check every hour
    return () => clearInterval(interval);
  }, []);

  return isWorldCup;
};
