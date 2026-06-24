import React from 'react';
import { NavLink } from 'react-router-dom';
import { Trophy, Star, TrendingUp, Newspaper, Users, Home, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  className?: string;
}

const mainNavItems = [
  { title: "Dashboard", icon: Home, path: "/" },
  { title: "Football Hub", icon: Trophy, path: "/football" },
  { title: "Cricket Center", icon: Activity, path: "/cricket" },
  { title: "Performance Lab", icon: Activity, path: "/performance-lab" },
];

const discoverItems = [
  { title: "Trending Players", icon: TrendingUp, path: "/profile" },
  { title: "Global News", icon: Newspaper, path: "/global-news" },
  { title: "Auction Room", icon: Users, path: "/auctions" },
];

const topLeagues = [
  { name: "Premier League", icon: "⚽", path: "/football/league/47" },
  { name: "Champions League", icon: "⚽", path: "/football/league/42" },
  { name: "IPL", icon: "🏏", path: "/" },
  { name: "NBA", icon: "🏀", path: "/" },
];

const Sidebar = ({ className }: SidebarProps) => {
  return (
    <aside className={cn("h-screen sticky top-0 flex-shrink-0 w-64 bg-background/60 backdrop-blur-xl border-r border-border/40 py-8 flex flex-col gap-10 overflow-y-auto hidden lg:flex", className)}>
      
      <div className="px-6 flex flex-col gap-1.5">
        <h3 className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] mb-3 px-2">Main Navigation</h3>
        {mainNavItems.map((item) => (
          <NavLink
            key={item.title}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300",
                isActive 
                  ? "bg-primary/10 text-primary shadow-sm" 
                  : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon 
                  size={18} 
                  strokeWidth={isActive ? 2.5 : 2} 
                  className={cn("transition-colors", isActive ? "text-primary" : "text-muted-foreground/70 group-hover:text-foreground")} 
                />
                <span>{item.title}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>

      <div className="px-6 flex flex-col gap-1.5">
        <h3 className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] mb-3 px-2">Top Leagues</h3>
        {topLeagues.map((league) => (
          <NavLink
            key={league.name}
            to={league.path}
            className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-foreground/5 hover:text-foreground transition-all duration-300"
          >
            <span className="text-base grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all">{league.icon}</span>
            <span>{league.name}</span>
          </NavLink>
        ))}
      </div>

      <div className="px-6 flex flex-col gap-1.5">
        <h3 className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] mb-3 px-2">Discover</h3>
        {discoverItems.map((item) => (
          <NavLink
            key={item.title}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300",
                isActive 
                  ? "bg-foreground/10 text-foreground shadow-sm" 
                  : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon 
                  size={18} 
                  strokeWidth={isActive ? 2.5 : 2} 
                  className={cn("transition-colors", isActive ? "text-foreground" : "text-muted-foreground/70 group-hover:text-foreground")} 
                />
                <span>{item.title}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
      
      <div className="px-6 mt-auto pb-4">
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-5 backdrop-blur-md group hover:border-primary/40 transition-colors">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-primary/20 blur-2xl rounded-full group-hover:bg-primary/30 transition-colors" />
          <div className="relative z-10">
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="p-1.5 rounded-lg bg-primary/20 text-primary">
                <Star size={14} className="fill-primary" />
              </div>
              <h4 className="text-sm font-bold text-foreground tracking-tight">Go Premium</h4>
            </div>
            <p className="text-[11px] font-medium text-muted-foreground mb-4 leading-relaxed">
              Unlock ad-free experience, advanced stats & deep insights.
            </p>
            <button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold py-2.5 rounded-xl transition-all hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98]">
              Upgrade Now
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
