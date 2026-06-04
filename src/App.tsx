import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import MatchDetails from "./pages/MatchDetails";
import PerformanceLab from "./pages/PerformanceLab";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import OAuthCallback from "./pages/OAuthCallback";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import Preferences from "./pages/Preferences";
import Favorites from "./pages/Favorites";
import Leaderboard from "./pages/Leaderboard";
import AdminDashboard from "./pages/AdminDashboard";
import Achievements from "./pages/Achievements";
import ActivityHistory from "./pages/ActivityHistory";
import Create from "./pages/Create";
import ScoringPanel from "./pages/ScoringPanel";
import LiveMatchViewer from "./pages/LiveMatchViewer";
import TournamentDetailsPage from "./pages/TournamentDetailsPage";
import PlayerProfilePage from "./pages/PlayerProfilePage";
import ShowcaseRoom from "./pages/ShowcaseRoom";
import AuctionList from "./pages/auction/AuctionList";
import AuctioneerPanel from "./pages/auction/AuctioneerPanel";
import CreateAuction from "./pages/auction/CreateAuction";
import OwnerPanel from "./pages/auction/OwnerPanel";
import LiveAuction from "./pages/auction/LiveAuction";
import AuctionAnalytics from "./pages/auction/AuctionAnalytics";
import FootballTournamentCreate from "./pages/football/FootballTournamentCreate";
import FootballTournamentDetails from "./pages/football/FootballTournamentDetails";
import FootballScoringPanel from "./pages/football/FootballScoringPanel";
import LiveFootballMatch from "./pages/football/LiveFootballMatch";
import FootballPointsTable from "./pages/football/FootballPointsTable";
import FootballMatchResult from "./pages/football/FootballMatchResult";
import FootballTeamProfile from "./pages/football/FootballTeamProfile";
import FootballPlayerProfile from "./pages/football/FootballPlayerProfile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Initialize theme on app load
const initializeTheme = () => {
  const savedTheme = localStorage.getItem("theme");
  const darkMode = savedTheme !== "light";

  if (darkMode) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
};

// Run on mount
initializeTheme();

const App = () => {
  useEffect(() => {
    initializeTheme();
  }, []);

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/oauth/callback" element={<OAuthCallback />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />

              {/* Protected Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/match/:id"
                element={
                  <ProtectedRoute>
                    <MatchDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/performance-lab"
                element={
                  <ProtectedRoute>
                    <PerformanceLab />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/preferences"
                element={
                  <ProtectedRoute>
                    <Preferences />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/favorites"
                element={
                  <ProtectedRoute>
                    <Favorites />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leaderboard"
                element={
                  <ProtectedRoute>
                    <Leaderboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/achievements"
                element={
                  <ProtectedRoute>
                    <Achievements />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/activity-history"
                element={
                  <ProtectedRoute>
                    <ActivityHistory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/showcase"
                element={
                  <ProtectedRoute>
                    <ShowcaseRoom />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/create"
                element={
                  <ProtectedRoute>
                    <Create />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/score/:id"
                element={
                  <ProtectedRoute>
                    <ScoringPanel />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/live/:id"
                element={<LiveMatchViewer />}
              />

              <Route
                path="/tournament/:id"
                element={
                  <ProtectedRoute>
                    <TournamentDetailsPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/player/:name"
                element={
                  <ProtectedRoute>
                    <PlayerProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* Football Routes */}
              <Route path="/football/tournament/create" element={<ProtectedRoute><FootballTournamentCreate /></ProtectedRoute>} />
              <Route path="/football/tournament/:id" element={<ProtectedRoute><FootballTournamentDetails /></ProtectedRoute>} />
              <Route path="/football/score/football/:id" element={<ProtectedRoute><FootballScoringPanel /></ProtectedRoute>} />
              <Route path="/football/live/:id" element={<LiveFootballMatch />} />
              <Route path="/football/points-table/:id" element={<FootballPointsTable />} />
              <Route path="/football/match/result/:id" element={<FootballMatchResult />} />
              <Route path="/football/team/:id" element={<ProtectedRoute><FootballTeamProfile /></ProtectedRoute>} />
              <Route path="/football/player/:teamId/:playerName" element={<ProtectedRoute><FootballPlayerProfile /></ProtectedRoute>} />

              {/* Auction Routes */}
              <Route path="/auctions" element={<ProtectedRoute><AuctionList /></ProtectedRoute>} />
              <Route path="/auction/create" element={<ProtectedRoute><CreateAuction /></ProtectedRoute>} />
              <Route path="/auction/manage/:id" element={<ProtectedRoute><AuctioneerPanel /></ProtectedRoute>} />
              <Route path="/auction/owner/:id" element={<OwnerPanel />} />
              <Route path="/auction/live/:id" element={<LiveAuction />} />
              <Route path="/auction/analytics/:id" element={<ProtectedRoute><AuctionAnalytics /></ProtectedRoute>} />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;
