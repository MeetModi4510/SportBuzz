import axios from 'axios';
import { Match } from '@/data/types';
import { mapApiMatchToModel } from './cricketMapper';

const API_URL = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL 
    : (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        if (error.response?.status === 401) {
            console.error("API 401 Error on:", error.config?.url);
            // We used to redirect to login here, but it caused aggressive redirect loops
            // if a single component like notifications threw a 401.
            // Now we just let the error propagate. The ProtectedRoute handles missing tokens.
            if (error.config?.url === '/auth/me') {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                // Only redirect if auth/me explicitly fails
                window.location.href = '/login?error=session_expired';
            }
        }
        return Promise.reject(error);
    }
);

export const authApi = {
    login: (credentials: any) => api.post('auth/login', credentials),
    signup: (userData: any) => api.post('auth/signup', userData),
    getMe: () => api.get('auth/me'),
    forgotPassword: (email: string) => api.post('auth/forgot-password', { email }),
    verifySecurityAnswer: (data: any) => api.post('auth/verify-security-answer', data),
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }
};

export const cricketApi = {
    getLiveMatches: () => api.get('cricket/matches/live'),
    getUpcomingMatches: () => api.get('cricket/matches/upcoming'),
    getRecentMatches: () => api.get('cricket/matches/recent'),
    getMatchScorecard: (matchId: string) => api.get(`cricket/match/${matchId}/scorecard`),
    getMatchSquads: (matchId: string) => api.get(`cricket/match/${matchId}/squads`),
    getMatchInfo: (matchId: string) => api.get(`cricket/match/${matchId}/info`),
    getCricbuzzScorecard: (matchId: string) => api.get(`cricket/cb/scorecard/${matchId}`),
    getCricbuzzSquads: (matchId: string) => api.get(`cricket/cb/squads/${matchId}`),
    getCricbuzzCommentary: (matchId: string) => api.get(`cricket/cb/commentary/${matchId}`),
    getFeaturedMatches: async () => {
        try {
            const res = await api.get('featured/matches');
            
            if (res.data?.cricket) {
                const { test, odi, t20 } = res.data.cricket;

                const processFormat = (formatData: any): Match[] => {
                    if (!Array.isArray(formatData)) return [];
                    return formatData
                        .map(m => {
                            try {
                                return mapApiMatchToModel(m);
                            } catch (e) {
                                console.error("[MAPPER ERROR] Failed to map match:", m?.id, e);
                                return null;
                            }
                        })
                        .filter(Boolean) as Match[];
                };

                return {
                    test: processFormat(test),
                    odi: processFormat(odi),
                    t20: processFormat(t20)
                };
            }

            return { test: [], odi: [], t20: [] };
        } catch (error) {
            console.error("getFeaturedMatches failed:", error);
            return { test: [], odi: [], t20: [] };
        }
    }
};

export const footballApi = {
    // Tournaments
    createTournament: (data: any) => api.post('football/tournaments', data),
    getTournaments: () => api.get('football/tournaments'),
    getTournamentById: (id: string) => api.get(`football/tournaments/${id}`),
    createTeam: (data: any) => api.post('football/teams', data),
    getTeams: () => api.get('football/teams'),
    addTeamToTournament: (id: string, teamId: string) => api.post(`football/tournaments/${id}/teams`, { teamId }),
    createMatch: (data: any) => api.post('football/matches', data),
    getMatchById: (id: string) => api.get(`football/matches/${id}`),
    addEvent: (id: string, event: any) => api.post(`football/matches/${id}/events`, event),
    updateTimer: (id: string, timer: any) => api.post(`football/matches/${id}/timer`, timer),
    finalizeMatch: (id: string) => api.post(`football/matches/${id}/finalize`),
    deleteMatch: (id: string) => api.delete(`football/matches/${id}`),
    updateMatchLineups: (id: string, lineups: any) => api.post(`football/matches/${id}/lineups`, lineups),
    updateTournament: (id: string, data: any) => api.put(`football/tournaments/${id}`, data),
    deleteTournament: (id: string) => api.delete(`football/tournaments/${id}`),
    updateTeam: (id: string, data: any) => api.put(`football/teams/${id}`, data),
    getTeamById: (id: string) => api.get(`football/teams/${id}`),
    follow: (id: string) => api.post(`football/tournaments/${id}/follow`),
    unfollow: (id: string) => api.post(`football/tournaments/${id}/unfollow`),
    
    // Stats
    getTournamentStats: (id: string) => api.get(`football/tournaments/${id}/stats`),
    
    // External/Existing
    getMatchSquads: (matchId: string) => api.get(`football/match/${matchId}/squads`),
    getLiveMatches: () => api.get('football/matches/live')
};

export const tournamentApi = {
    getAll: (params?: any) => api.get('tournaments', { params }),
    getById: (id: string) => api.get(`tournaments/${id}`),
    create: (data: any) => api.post('tournaments', data),
    update: (id: string, data: any) => api.put(`tournaments/${id}`, data),
    delete: (id: string) => api.delete(`tournaments/${id}`),
    getStats: (id: string) => api.get(`tournaments/${id}/stats`),
    shuffleGroups: (id: string) => api.put(`tournaments/${id}/shuffle`),
    recalculate: (id: string) => api.post(`tournaments/${id}/recalculate`),
    recalculatePointsTable: (id: string) => api.post(`tournaments/${id}/recalculate`),
    addTeam: (id: string, teamId: string, data?: any) => api.post(`tournaments/${id}/teams`, { teamId, ...data }),
    follow: (id: string) => api.post(`tournaments/${id}/follow`),
    unfollow: (id: string) => api.post(`tournaments/${id}/unfollow`),
    search: (query: string) => api.get('tournaments', { params: { search: query } }),
    getMyTournaments: (userId: string) => api.get('tournaments', { params: { userId } })
};

export const teamApi = {
    getAll: () => api.get('teams'),
    getById: (id: string) => api.get(`teams/${id}`),
    create: (data: any) => api.post('teams', data),
    update: (id: string, data: any) => api.put(`teams/${id}`, data),
    delete: (id: string) => api.delete(`teams/${id}`)
};

export const playerApi = {
    getAll: () => api.get('players'),
    create: (data: any) => api.post('players', data),
    getStats: (name: string) => api.get(`players/${name}/stats`),
    getMatchup: (batsman: string, bowler: string) => api.get(`players/matchup/${encodeURIComponent(batsman)}/${encodeURIComponent(bowler)}`),
    search: (q: string) => api.get(`players/search?q=${encodeURIComponent(q)}`),
    checkTournament: (name: string, tournamentId: string) => api.get(`players/check-tournament?name=${encodeURIComponent(name)}&tournamentId=${tournamentId}`),
    updatePhoto: (idOrName: string, formData: FormData) => api.put(`players/${encodeURIComponent(idOrName)}/photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    })
};

export const customMatchApi = {
    getAll: (params?: any) => api.get('matches', { params }),
    create: (data: any) => api.post('matches', data),
    update: (id: string, data: any) => api.put(`matches/${id}`, data),
    getById: (id: string) => api.get(`matches/${id}`),
    delete: (id: string) => api.delete(`matches/${id}`),
    getBalls: (id: string) => api.get(`matches/${id}/balls`),
    recordBall: (id: string, data: any) => api.post(`matches/${id}/balls`, data),
    undoLastBall: (id: string) => api.delete(`matches/${id}/balls/last`),
    recordCommentaryBall: (id: string, message: string, inning: number, over: number, ball: number) => 
        api.post(`matches/${id}/balls`, {
            isCommentaryOnly: true,
            commentaryMessage: message,
            inning,
            over,
            ball
        })
};

export const userApi = {
  getProfile: () => api.get('user/profile'),
  updateProfile: (data: any) => api.put('user/profile', data),
  getPreferences: () => api.get('user/preferences'),
  updatePreferences: (data: any) => api.put('user/preferences', data),
  getStats: () => api.get('user/stats')
};

export const favoritesApi = {
  get: () => api.get('user/favorites'),
  add: (data: any) => api.post('user/favorites', data),
  remove: (id: string) => api.delete(`user/favorites/${id}`),
  check: (id: string) => api.get(`user/favorites/check/${id}`)
};

export const leaderboardApi = {
  getGlobal: () => api.get('leaderboard/global'),
  getTournament: (id: string) => api.get(`leaderboard/tournament/${id}`)
};

export const notificationApi = {
  getAll: () => api.get('notifications'),
  markAsRead: (id: string) => api.put(`notifications/${id}/read`),
  markAllAsRead: () => api.put('notifications/read-all'),
  delete: (id: string) => api.delete(`notifications/${id}`)
};

export const adminApi = {
    getStats: () => api.get('admin/stats'),
    getUsers: (params?: any) => api.get('admin/users', { params }),
    getPlayers: () => api.get('admin/players'),
    deletePlayer: (name: string) => api.post('admin/players/delete', { name }),
    updateRole: (id: string, role: string) => api.put(`admin/users/${id}/role`, { role }),
    deleteUser: (id: string) => api.delete(`admin/users/${id}`)
};

export const auctionApi = {
    create: (data: any) => api.post('auctions', data),
    list: () => api.get('auctions'),
    get: (id: string) => api.get(`auctions/${id}`),
    updateTeams: (id: string, teams: any[]) => api.put(`auctions/${id}/teams`, { teams }),
    addPlayers: (id: string, players: any[]) => api.post(`auctions/${id}/players`, { players }),
    start: (id: string) => api.post(`auctions/${id}/start`),
    nextPlayer: (id: string, category?: string) => api.post(`auctions/${id}/next-player`, { category }),
    placeBid: (id: string, data: { teamId: string, amount: number }) => api.post(`auctions/${id}/bid`, data),
    sell: (id: string) => api.post(`auctions/${id}/sell`),
    finalize: (id: string) => api.post(`auctions/${id}/finalize`),
    clearPlayers: (id: string) => api.post(`auctions/${id}/clear-players`),
    follow: (id: string) => api.post(`auctions/${id}/follow`),
    deletePlayer: (id: string, playerId: string) => api.delete(`auctions/${id}/players/${playerId}`),
    undoBid: (id: string) => api.post(`auctions/${id}/undo-bid`),
    delete: (id: string) => api.delete(`auctions/${id}`),
    update: (id: string, data: any) => api.put(`auctions/${id}`, data),
    ownerLogin: (id: string, email: string, accessCode: string) => api.post(`auctions/${id}/owner-login`, { email, accessCode }),
    uploadTeamLogo: (id: string, teamId: string, formData: FormData) => api.put(`auctions/${id}/teams/${teamId}/logo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    getAnalytics: (id: string) => api.get(`auctions/${id}/analytics`),
    getTrades: (id: string) => api.get(`auctions/${id}/trades`),
    createTrade: (id: string, data: any) => api.post(`auctions/${id}/trade`, data),
    respondToTrade: (id: string, tradeId: string, status: string) => api.post(`auctions/${id}/trade/${tradeId}/respond`, { status }),
    approveTrade: (id: string, tradeId: string) => api.post(`auctions/${id}/trade/${tradeId}/approve`)
};

export const activityApi = {
    getAll: () => api.get('activity'),
    getAchievements: () => api.get('activity/achievements'),
    getSummary: () => api.get('activity/summary')
};

export default api;
