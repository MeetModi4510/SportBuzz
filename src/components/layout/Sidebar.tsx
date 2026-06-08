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
  { name: "Premier League", icon: "⚽", path: "/football" },
  { name: "Champions League", icon: "⚽", path: "/football" },
  { name: "IPL", icon: "🏏", path: "/" },
  { name: "NBA", icon: "🏀", path: "/" },
];

const Sidebar = ({ className }: SidebarProps) => {
  return (
    <aside className={cn("h-screen sticky top-0 flex-shrink-0 w-64 bg-card/50 backdrop-blur-sm border-r border-border/50 py-6 flex flex-col gap-8 overflow-y-auto hidden lg:flex", className)}>
      <div className="px-6 flex flex-col gap-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Main Navigation</h3>
        {mainNavItems.map((item) => (
          <NavLink
            key={item.title}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-white/5 hover:text-white"
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.title}
          </NavLink>
        ))}
      </div>

      <div className="px-6 flex flex-col gap-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Top Leagues</h3>
        {topLeagues.map((league) => (
          <NavLink
            key={league.name}
            to={league.path}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-white/5 hover:text-white transition-colors"
          >
            <span>{league.icon}</span>
            {league.name}
          </NavLink>
        ))}
      </div>

      <div className="px-6 flex flex-col gap-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Discover</h3>
        {discoverItems.map((item) => (
          <NavLink
            key={item.title}
            to={item.path}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-white/5 hover:text-white transition-colors"
          >
            <item.icon className="h-4 w-4" />
            {item.title}
          </NavLink>
        ))}
      </div>
      
      <div className="px-6 mt-auto">
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Star className="h-4 w-4 text-primary fill-primary" />
            <h4 className="text-sm font-semibold text-white">Go Premium</h4>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Unlock ad-free experience and advanced stats.</p>
          <button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold py-2 rounded transition-colors">
            Upgrade Now
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
