import { cn, formatOversText, formatScoreString } from "@/lib/utils";
import { Match, Sport } from "@/data/types";
import { formatToIST } from "@/lib/dateUtils";
import { MapPin, Clock } from "lucide-react";
import { TeamLogo } from "./TeamLogo";
import { getSportBorderColor } from "./SportIcon";
import { useState, useEffect } from "react";
import { io } from "socket.io-client";

interface MatchCardProps {
  match: Match;
  onClick?: (match: Match) => void;
  className?: string;
  showSeriesName?: boolean;
}



export const MatchCard = ({ match: initialMatch, onClick, className, showSeriesName }: MatchCardProps) => {
  const [match, setMatch] = useState<Match>(initialMatch);

  // Sync prop changes
  useEffect(() => {
    setMatch(initialMatch);
  }, [initialMatch]);

  // Infer the season based on startTime or displayTime
  const matchSeason = (typeof (match.startTime as unknown) === 'string' ? (match.startTime as unknown as string).substring(0, 4) : match.startTime instanceof Date ? match.startTime.getFullYear().toString() : undefined) || match.displayTime?.match(/\b(20\d{2})\b/)?.[1] || undefined;

  // Socket listener for live updates
  useEffect(() => {
    if (match.sport === 'cricket' && match.status === 'live') {
      const socketUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : '');
      const newSocket = io(socketUrl, {
        path: '/socket.io/',
        transports: ['websocket', 'polling'],
      });

      const handleUpdate = (data: any) => {
        if (data.matchId === match.id) {
          setMatch(prev => {
            const updated = { ...prev };
            if (data.cricketLiveDetails) {
              updated.cricketLiveDetails = data.cricketLiveDetails;
            }
            if (data.score && data.score.team1) {
              updated.homeScore = `${data.score.team1.runs}/${data.score.team1.wickets} (${formatOversText(data.score.team1.overs)})`;
            }
            if (data.score && data.score.team2) {
              updated.awayScore = `${data.score.team2.runs}/${data.score.team2.wickets} (${formatOversText(data.score.team2.overs)})`;
            }
            return updated;
          });
        }
      };

      newSocket.on('live_matches_update', handleUpdate);
      newSocket.on('score_updated', handleUpdate);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [match.id, match.sport, match.status]);

  const isLive = match.status === "live";
  const isUpcoming = match.status === "upcoming";

  const scoresUnavailable = (match as any)._scoresUnavailable === true || 
    (isLive && !match.homeScore && !match.awayScore);

  const getStatusText = () => {
    if (isLive) {
      if (match.sport === "football" && match.currentMinute) return `${match.currentMinute}'`;
      if (match.sport === "basketball" && match.currentQuarter) return `Q${match.currentQuarter}`;
      if (match.sport === "tennis" && match.currentSet) return `Set ${match.currentSet}`;
      if (match.sport === "cricket" && match.currentOver) return `Ov ${formatScoreString(String(match.currentOver))}`;
      return "Live";
    }
    if (isUpcoming) return "Upcoming";
    return "Result";
  };

  const getStatusColor = () => {
    if (isLive) return "text-red-500 font-semibold";
    if (isUpcoming) return "text-blue-500 font-medium";
    return "text-muted-foreground";
  };

  const themeBorder = getSportBorderColor(match.sport) || "border-border/60";
  const isFinalMatch = match.matchType?.toLowerCase().includes('final');

  const allMatchText = [match?.tournament?.name, (match as any)?.name, (match as any)?.seriesName, match?.matchType].filter(Boolean).join(" ").toLowerCase();
  const isTheHundred = allMatchText.includes('the hundred');

  const formatOversForHundred = (oversStr: string | number) => {
    const oversNum = parseFloat(oversStr.toString());
    if (isNaN(oversNum)) return oversStr.toString();
    return `${oversNum}`;
  };

  const processScore = (scoreStr: string) => {
    if (!scoreStr || !isTheHundred) return scoreStr;
    return scoreStr.replace(/\(([\d.]+)\s*ov(?:ers?)?\)/i, (match, overs) => {
      return `(${formatOversForHundred(overs)} BALLS)`;
    });
  };

  return (
    <div
      onClick={() => onClick?.(match)}
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-secondary/30 p-4 transition-all duration-200",
        themeBorder,
        isFinalMatch ? "border-yellow-500/40 shadow-[0_0_15px_rgba(234,179,8,0.1)] bg-yellow-500/[0.03]" : "",
        "hover:bg-secondary/50 hover:shadow-md cursor-pointer",
        "w-full flex flex-col gap-4",
        className
      )}
    >
      {/* Header */}
      <div className={cn("flex items-center justify-between pb-3 border-b", themeBorder)}>
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="text-[11px] text-muted-foreground tracking-widest font-semibold uppercase truncate" title={match.seriesName || match.matchType}>
            {isTheHundred ? "The Hundred" : (showSeriesName && match.seriesName ? match.seriesName : match.matchType)}
          </span>
          {isTheHundred && <span className="bg-[#39FF14] text-black px-2 py-0.5 rounded shadow-[0_0_8px_rgba(57,255,20,0.5)] text-[10px] font-black tracking-tight shrink-0">100</span>}
        </div>
        <div className="flex items-center gap-2">
           {isLive && <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />}
           <span className={cn("text-[11px] uppercase tracking-widest", getStatusColor())}>
             {getStatusText()}
           </span>
        </div>
      </div>

      {/* Teams & Score */}
      <div className="flex flex-col gap-3.5">
        {/* Home Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <TeamLogo season={matchSeason} logo={match.homeTeam?.logo || ''} name={match.homeTeam?.name || 'TBA'} shortName={match.homeTeam?.shortName} size="md" className="w-11 h-11 shadow-sm" />
            <span className="font-semibold text-foreground text-[15px] tracking-tight">{match.homeTeam?.name || 'TBA'}</span>
          </div>
          <div className="flex flex-col items-end">
             {Array.isArray(match.inningsScores) && match.inningsScores.length > 0 ? (
                 match.inningsScores.filter(i => i?.team === 'home').map((inn, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span className="font-bold text-[15px] tracking-tight text-foreground">
                        {inn.score}
                      </span>
                      {inn.overs && (
                        <span className="text-xs text-muted-foreground font-medium">
                          ({isTheHundred ? formatOversForHundred(inn.overs) + ' BALLS' : formatOversText(inn.overs)})
                        </span>
                      )}
                    </div>
                 ))
             ) : (
                 <span className="font-bold text-[15px] tracking-tight text-foreground">
                   {processScore(formatScoreString(match.homeScore) || (isUpcoming ? '-' : (scoresUnavailable ? '-' : '0/0')))}
                 </span>
             )}
          </div>
        </div>

        {/* Away Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <TeamLogo season={matchSeason} logo={match.awayTeam?.logo || ''} name={match.awayTeam?.name || 'TBA'} shortName={match.awayTeam?.shortName} size="md" className="w-11 h-11 shadow-sm" />
            <span className="font-semibold text-foreground text-[15px] tracking-tight">{match.awayTeam?.name || 'TBA'}</span>
          </div>
          <div className="flex flex-col items-end">
             {Array.isArray(match.inningsScores) && match.inningsScores.length > 0 ? (
                 match.inningsScores.filter(i => i?.team === 'away').map((inn, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span className="font-bold text-[15px] tracking-tight text-foreground">
                        {inn.score}
                      </span>
                      {inn.overs && (
                        <span className="text-xs text-muted-foreground font-medium">
                          ({isTheHundred ? formatOversForHundred(inn.overs) + ' BALLS' : formatOversText(inn.overs)})
                        </span>
                      )}
                    </div>
                 ))
             ) : (
                 <span className="font-bold text-[15px] tracking-tight text-foreground">
                   {processScore(formatScoreString(match.awayScore) || (isUpcoming ? '-' : (scoresUnavailable ? '-' : '0/0')))}
                 </span>
             )}
          </div>
        </div>
      </div>

      {/* Live Cricket Stats */}
      {match.sport === 'cricket' && isLive && match.cricketLiveDetails && (
        <div className={cn("pt-3 border-t flex flex-col gap-1 text-[11px]", themeBorder)}>
          {/* Batters */}
          <div className="flex justify-between text-muted-foreground font-medium mb-0.5">
            <span className="w-[45%]">Batter</span>
            <div className="flex w-[55%] justify-between">
              <span className="w-8 text-right">R</span>
              <span className="w-8 text-right">B</span>
              <span className="w-6 text-right">4s</span>
              <span className="w-6 text-right">6s</span>
              <span className="w-10 text-right">SR</span>
            </div>
          </div>
          {match.cricketLiveDetails.batsmanStriker && (
            <div className="flex justify-between text-foreground">
              <span className="w-[45%] truncate font-semibold">{match.cricketLiveDetails.batsmanStriker.batName}*</span>
              <div className="flex w-[55%] justify-between">
                <span className="w-8 text-right font-semibold">{match.cricketLiveDetails.batsmanStriker.runs}</span>
                <span className="w-8 text-right">{match.cricketLiveDetails.batsmanStriker.balls}</span>
                <span className="w-6 text-right">{match.cricketLiveDetails.batsmanStriker.fours}</span>
                <span className="w-6 text-right">{match.cricketLiveDetails.batsmanStriker.sixes}</span>
                <span className="w-10 text-right">{match.cricketLiveDetails.batsmanStriker.strikeRate}</span>
              </div>
            </div>
          )}
          {match.cricketLiveDetails.batsmanNonStriker && (
            <div className="flex justify-between text-muted-foreground">
              <span className="w-[45%] truncate">{match.cricketLiveDetails.batsmanNonStriker.batName}</span>
              <div className="flex w-[55%] justify-between">
                <span className="w-8 text-right font-medium">{match.cricketLiveDetails.batsmanNonStriker.runs}</span>
                <span className="w-8 text-right">{match.cricketLiveDetails.batsmanNonStriker.balls}</span>
                <span className="w-6 text-right">{match.cricketLiveDetails.batsmanNonStriker.fours}</span>
                <span className="w-6 text-right">{match.cricketLiveDetails.batsmanNonStriker.sixes}</span>
                <span className="w-10 text-right">{match.cricketLiveDetails.batsmanNonStriker.strikeRate}</span>
              </div>
            </div>
          )}

          {/* Bowler */}
          <div className="flex justify-between text-muted-foreground font-medium mt-1 mb-0.5 pt-1.5 border-t border-border/40">
            <span className="w-[45%]">Bowler</span>
            <div className="flex w-[55%] justify-between">
              <span className="w-8 text-right">O</span>
              <span className="w-8 text-right">M</span>
              <span className="w-8 text-right">R</span>
              <span className="w-8 text-right">W</span>
              <span className="w-10 text-right">ECO</span>
            </div>
          </div>
          {match.cricketLiveDetails.bowlerStriker && (
            <div className="flex justify-between text-foreground">
              <span className="w-[45%] truncate">{match.cricketLiveDetails.bowlerStriker.bowlName}</span>
              <div className="flex w-[55%] justify-between">
                <span className="w-8 text-right">{match.cricketLiveDetails.bowlerStriker.overs}</span>
                <span className="w-8 text-right">{match.cricketLiveDetails.bowlerStriker.maidens}</span>
                <span className="w-8 text-right">{match.cricketLiveDetails.bowlerStriker.runs}</span>
                <span className="w-8 text-right font-semibold">{match.cricketLiveDetails.bowlerStriker.wickets}</span>
                <span className="w-10 text-right">{match.cricketLiveDetails.bowlerStriker.economy}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer / Match Status Summary */}
      <div className={cn("pt-3.5 border-t flex flex-col gap-2.5", themeBorder)}>
        {match.summaryText && (
          <span className={cn("text-xs font-semibold leading-relaxed", isLive ? "text-red-400" : "text-primary/90")}>
            {match.summaryText}
          </span>
        )}
        <div className="flex items-center gap-4 text-[11px] text-muted-foreground/80 uppercase tracking-wide font-medium">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin size={11} className="flex-shrink-0" />
            <span className="truncate">{typeof match.venue === 'object' ? match.venue?.name : match.venue || "Venue"}</span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Clock size={11} />
            <span>{match.displayTime || formatToIST(new Date(match.startTime), 'full')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
