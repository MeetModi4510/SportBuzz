import api from '../api';

export const transfersApi = {
  getLatestTransfers: async (): Promise<{ transfers: any[] }> => {
    try {
      const res: any = await api.get('/football/transfers');
      let transfers = res?.data || [];
      
      transfers = transfers.map((t: any) => ({
        ...t,
        name: t.name || t.playerName,
        position: typeof t.position === 'string' ? { label: t.position, key: t.position } : t.position
      }));
      
      return { transfers };
    } catch (error) {
      console.error('Failed to fetch transfers', error);
      throw error;
    }
  }
};
