import React from 'react';
import { cn } from "../../lib/utils";
import { Clock, MapPin } from "lucide-react";
import { FootballTeamLogo } from "./FootballTeamLogo";
import { formatToIST } from "../../lib/dateUtils";

// Keep backward-compatible with LivescoreMatch type but also accept Sofascore matches
type MatchLike = {
  id: string;
  apiId: string;
  status: 'live' | 'upcoming' | 'completed';
  leagueName: string;
  homeTeam: { id: string; name: string; logo: string | null };
  awayTeam: { id: string; name: string; logo: string | null };
  homeScore: string;
  awayScore: string;
  startTime: string;
  displayTime: string;
  category?: string;
  venue?: string;
  [key: string]: any;
};

const API_BASE = import.meta.env.PROD
  ? 'https://sportbuzz-backend.onrender.com'
  : 'http://localhost:5000';

/** Resolve any logo string to an actual URL */
function resolveLogo(logo: string | null | undefined): string {
  if (!logo) return '';
  if (logo.startsWith('sofascore:team:')) {
    return `${API_BASE}/api/football/v3/team-logo/${logo.replace('sofascore:team:', '')}`;
  }
  if (logo.startsWith('sofascore:tournament:')) {
    return `${API_BASE}/api/football/v3/tournament-logo/${logo.replace('sofascore:tournament:', '')}`;
  }
  return logo;
}

interface LivescoreMatchCardProps {
  match: MatchLike;
  onClick?: (match: MatchLike) => void;
  className?: string;
}

const TEAM_COLORS: Record<string, string> = {
  // International
  'argentina': '#0284c7', // Sky Blue
  'brazil': '#ca8a04', // Yellow
  'france': '#002654', // Navy
  'england': '#1e3a8a', // Navy (Secondary)
  'spain': '#C60B1E', // Red
  'italy': '#1e3a8a', // Blue
  'germany': '#1c1917', // Black
  'netherlands': '#FF6F00', // Orange
  'belgium': '#7f1d1d', // Red
  'croatia': '#991b1b', // Red
  'mexico': '#14532d', // Green
  'south africa': '#064e3b', // Green/Gold
  'south korea': '#7f1d1d', // Red
  'czechia': '#991b1b', // Red
  'nigeria': '#14532d', // Green
  'costa rica': '#991b1b', // Red
  'bolivia': '#14532d', // Green
  'algeria': '#14532d', // Green
  'united states': '#1e3a8a', // Navy
  'canada': '#991b1b', // Red
  'morocco': '#C1272D', // Red
  'senegal': '#00853F', // Green
  'japan': '#0033A0', // Blue
  'uruguay': '#6EC6FF', // Sky Blue
  'colombia': '#ca8a04', // Yellow
  'chile': '#991b1b', // Red
  'switzerland': '#D52B1E', // Red
  'denmark': '#991b1b', // Red
  'poland': '#991b1b', // Red
  'sweden': '#FFCD00', // Yellow
  'wales': '#991b1b', // Red
  'scotland': '#1e3a8a', // Navy
  'saudi arabia': '#006C35', // Green
  'bahrain': '#dc2626', // Red
  'haiti': '#0057B8',
  'bosnia-herzegovina': '#0057B8',
  'australia': '#ca8a04',
  'turkiye': '#E30A17',
  'paraguay': '#D52B1E',
  'qatar': '#8A1538',
  'tunisia': '#E70013',
  'cape verde': '#003893',
  'egypt': '#CE1126',
  'iran': '#239F40',
  'curacao': '#0055A4',
  'ivory coast': '#F77F00',
  'ecuador': '#FFD100',
  'new zealand': '#000000',
  'iraq': '#007A3D',
  'norway': '#BA0C2F',
  'austria': '#ED2939',
  'jordan': '#CE1126',
  'portugal': '#D00027',
  'congo dr': '#007FFF',
  'uzbekistan': '#0099B5',
  'ghana': '#FCD116',
  'panama': '#D21034',
  'india': '#0033A0',





  // Clubs
  'arsenal': '#7f1d1d',
  'chelsea': '#1e3a8a',
  'liverpool': '#7f1d1d',
  'manchester city': '#0284c7',
  'manchester united': '#7f1d1d',
  'tottenham hotspur': '#1e293b',
  'real madrid': '#1e293b',
  'barcelona': '#A50044',
  'atletico madrid': '#CE3524',
  'bayern munich': '#7f1d1d',
  'borussia dortmund': '#ca8a04',
  'paris saint-germain': '#172554',
  'juventus': '#1c1917',
  'inter': '#1e3a8a',
  'ac milan': '#7f1d1d',
  'napoli': '#0284c7',
  'malaga': '#0284c7',
  'las palmas': '#ca8a04',
  'inter miami': '#F7B5CD',
  'sevilla': '#D71920',
  'villareal': '#FFF200',
};

const getTeamColor = (teamName: string, isHome: boolean) => {
  // Normalize string to remove diacritics (e.g., Curaçao -> curacao, Türkiye -> turkiye)
  const name = teamName
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  // Try exact match
  if (TEAM_COLORS[name]) {
    return TEAM_COLORS[name];
  }

  // Try partial match
  for (const [key, color] of Object.entries(TEAM_COLORS)) {
    if (name.includes(key)) {
      return color;
    }
  }

  // Generate a consistent color based on team name hash if not found
  const hash = name.split("").reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  const colors = [
    "#7f1d1d", // Red
    "#1e3a8a", // Blue
    "#14532d", // Green
    "#ca8a04", // Yellow/Gold
    "#4c1d95", // Purple
    "#9d174d", // Pink
    "#0f766e", // Teal
    "#b45309", // Orange
  ];
  return colors[Math.abs(hash) % colors.length];
};

export const LivescoreMatchCard = ({ match, onClick, className }: LivescoreMatchCardProps) => {
  const isLive = ['live', 'in', 'inprogress'].includes(match.status?.toLowerCase());
  const isUpcoming = ['upcoming', 'pre'].includes(match.status?.toLowerCase());
  const displayTime = match.displayTime || match.statusDetail;

  const homeColor = getTeamColor(match.homeTeam.name, true);
  const awayColor = getTeamColor(match.awayTeam.name, false);

  return (
    <div
      onClick={() => onClick?.(match)}
      className={cn(
        "group relative overflow-hidden transition-all duration-500 cursor-pointer flex flex-col h-full",
        "rounded-2xl border-none shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:-translate-y-1",
        className
      )}
    >
      {/* Right Background Layer */}
      <div className="absolute inset-0 z-0" style={{ backgroundColor: awayColor }} />

      {/* Skewed Left Background */}
      <div
        className="absolute inset-y-0 w-[65%] z-0"
        style={{
          left: '-15%',
          backgroundColor: homeColor,
          transform: 'skewX(-15deg)',
          transformOrigin: 'center'
        }}
      />

      {/* Gold Separator Line */}
      <div
        className="absolute inset-y-0 w-[3px] bg-yellow-500 z-0"
        style={{
          left: '50%',
          transform: 'skewX(-15deg) translateX(-50%)',
          transformOrigin: 'center',
          boxShadow: '0 0 10px rgba(234,179,8,0.5)'
        }}
      />

      {/* Content Layer */}
      <div className="relative z-10 p-5 flex flex-col h-full text-white">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] tracking-widest font-bold uppercase text-white/90 drop-shadow-md">
              {match.leagueName}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isLive && <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />}
            <span className={cn(
              "text-[10px] tracking-widest font-bold uppercase drop-shadow-md",
              isLive ? "text-emerald-500" : "text-white/70"
            )}>
              {isLive ? displayTime : (isUpcoming ? 'Upcoming' : displayTime || 'FT')}
            </span>
          </div>
        </div>

        {/* Teams & VS */}
        <div className="flex items-center justify-between flex-1 relative px-1 py-2">

          {/* Home Team */}
          <div className="flex flex-col items-center gap-2 w-[40%]">
            {match.homeTeam.name.toLowerCase() === 'switzerland' ? (
              <div className="p-2 rounded-full bg-white shadow-lg">
                <FootballTeamLogo logo={resolveLogo(match.homeTeam.logo)} name={match.homeTeam.name} size="lg" className="w-10 h-10 object-contain drop-shadow-sm" />
              </div>
            ) : (
              <FootballTeamLogo logo={resolveLogo(match.homeTeam.logo)} name={match.homeTeam.name} size="lg" className="w-14 h-14 object-contain drop-shadow-xl" />
            )}
            <span className="font-extrabold text-[13px] tracking-wider uppercase text-center line-clamp-2 drop-shadow-md mt-1">
              {match.homeTeam.name}
            </span>
            {!isUpcoming && (
              <span className="font-black text-2xl drop-shadow-md mt-1">
                {match.homeScore || 0}
              </span>
            )}
          </div>

          {/* VS Badge */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
            <div className="w-11 h-11 bg-[#f4f1e1] rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.5)] border border-yellow-500/20">
              <span className="text-yellow-600 font-black italic text-lg tracking-tighter drop-shadow-sm">VS</span>
            </div>
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center gap-2 w-[40%] z-10">
            {match.awayTeam.name.toLowerCase() === 'switzerland' ? (
              <div className="p-2 rounded-full bg-white shadow-lg">
                <FootballTeamLogo logo={resolveLogo(match.awayTeam.logo)} name={match.awayTeam.name} size="lg" className="w-10 h-10 object-contain drop-shadow-sm" />
              </div>
            ) : (
              <FootballTeamLogo logo={resolveLogo(match.awayTeam.logo)} name={match.awayTeam.name} size="lg" className="w-14 h-14 object-contain drop-shadow-xl" />
            )}
            <span className="font-extrabold text-[13px] tracking-wider uppercase text-center line-clamp-2 drop-shadow-md mt-1">
              {match.awayTeam.name}
            </span>
            {!isUpcoming && (
              <span className="font-black text-2xl drop-shadow-md mt-1">
                {match.awayScore || 0}
              </span>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-[10px] tracking-widest font-bold uppercase text-white/60">
          <div className="flex items-center gap-1.5 drop-shadow-md">
            <MapPin size={12} className="text-emerald-400" />
            <span className="truncate max-w-[120px]">{match.category || 'TBA'}</span>
          </div>
          <div className="flex items-center gap-1.5 drop-shadow-md">
            <Clock size={12} className="text-yellow-400" />
            <span>
              {formatToIST(new Date(match.startTime), 'full')}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};

