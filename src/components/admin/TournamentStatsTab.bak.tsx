import React from 'react';

const TournamentStatsTab = ({ tournamentStats, segment, setSegment }: any) => {
  return (
    <div className="p-10 text-white bg-slate-900 rounded-xl border border-slate-700">
      <h1 className="text-2xl font-bold mb-4">Tournament Stats - Isolation Test</h1>
      <p className="text-slate-400">If you see this, the white screen is partially resolved (this component is not crashing the app).</p>
      <div className="mt-6 flex gap-2">
        {["Batting", "Bowling", "Fielding", "MVP"].map(s => (
          <button 
            key={s} 
            onClick={() => setSegment(s)}
            className={`px-4 py-2 rounded ${segment === s ? 'bg-blue-600' : 'bg-slate-800'}`}
          >
            {s}
          </button>
        ))}
      </div>
      <pre className="mt-10 p-4 bg-black rounded text-xs overflow-auto max-h-96">
        {JSON.stringify(tournamentStats, null, 2)}
      </pre>
    </div>
  );
};

export default TournamentStatsTab;
