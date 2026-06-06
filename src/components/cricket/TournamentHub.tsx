import { cn } from '@/lib/utils';
import { Medal, Star, TrendingUp } from 'lucide-react';
import { TeamLogo } from '@/components/TeamLogo';

const mockStandings = [
  { rank: 1, team: 'Rajasthan Royals', logo: 'https://cdn.sportmonks.com/images/cricket/teams/12/300.png', pld: 14, w: 9, l: 5, pts: 18, nrr: '+0.450' },
  { rank: 2, team: 'Kolkata Knight Riders', logo: 'https://cdn.sportmonks.com/images/cricket/teams/8/296.png', pld: 14, w: 8, l: 6, pts: 16, nrr: '+0.320' },
  { rank: 3, team: 'Chennai Super Kings', logo: 'https://cdn.sportmonks.com/images/cricket/teams/10/298.png', pld: 14, w: 8, l: 6, pts: 16, nrr: '+0.110' },
  { rank: 4, team: 'Royal Challengers Bengaluru', logo: 'https://cdn.sportmonks.com/images/cricket/teams/11/299.png', pld: 14, w: 7, l: 7, pts: 14, nrr: '-0.150' },
  { rank: 5, team: 'Mumbai Indians', logo: 'https://cdn.sportmonks.com/images/cricket/teams/9/297.png', pld: 14, w: 6, l: 8, pts: 12, nrr: '-0.200' },
];

export const TournamentHub = () => {
  return (
    <div className="bg-card/40 backdrop-blur-md rounded-[2rem] border border-border/50 p-6 md:p-8 flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
          <TrendingUp size={24} />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">Tournament Hub</h2>
          <p className="text-sm text-muted-foreground">Indian Premier League 2026 Standings</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Points Table */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-secondary/30">
              <tr>
                <th className="px-4 py-3 rounded-l-xl font-semibold">Team</th>
                <th className="px-3 py-3 font-semibold text-center">Pld</th>
                <th className="px-3 py-3 font-semibold text-center">W</th>
                <th className="px-3 py-3 font-semibold text-center">L</th>
                <th className="px-3 py-3 font-semibold text-center">NRR</th>
                <th className="px-4 py-3 rounded-r-xl font-semibold text-center">Pts</th>
              </tr>
            </thead>
            <tbody>
              {mockStandings.map((row, index) => (
                <tr key={row.team} className="border-b border-border/10 last:border-0 hover:bg-white/[0.02] transition-colors group">
                  <td className="px-4 py-3 font-medium flex items-center gap-3">
                    <span className="text-muted-foreground text-xs w-4">{row.rank}</span>
                    <TeamLogo logo={row.logo} name={row.team} size="sm" className="w-6 h-6 rounded-full" />
                    <span className="text-sm text-foreground truncate max-w-[120px] md:max-w-[200px]">{row.team}</span>
                  </td>
                  <td className="px-3 py-3 text-center text-muted-foreground">{row.pld}</td>
                  <td className="px-3 py-3 text-center text-emerald-500 font-medium">{row.w}</td>
                  <td className="px-3 py-3 text-center text-red-500 font-medium">{row.l}</td>
                  <td className="px-3 py-3 text-center text-muted-foreground font-mono text-xs">{row.nrr}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                      {row.pts}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Top Performers Sidebar */}
        <div className="w-full lg:w-72 flex flex-col gap-4">
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 flex items-center gap-4">
            <div className="p-3 bg-orange-500/20 text-orange-500 rounded-full">
              <Star size={20} />
            </div>
            <div>
              <p className="text-xs text-orange-500/80 font-bold uppercase tracking-wider mb-1">Most Runs</p>
              <h4 className="text-base font-bold text-foreground">Virat Kohli</h4>
              <p className="text-sm text-muted-foreground font-medium">741 Runs <span className="text-xs opacity-50 ml-1">(15 Inns)</span></p>
            </div>
          </div>

          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-500/20 text-purple-500 rounded-full">
              <Medal size={20} />
            </div>
            <div>
              <p className="text-xs text-purple-500/80 font-bold uppercase tracking-wider mb-1">Most Wickets</p>
              <h4 className="text-base font-bold text-foreground">Jasprit Bumrah</h4>
              <p className="text-sm text-muted-foreground font-medium">24 Wickets <span className="text-xs opacity-50 ml-1">(Econ 6.48)</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
