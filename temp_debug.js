2761:                           )}
2762: 
2763:                           {displayInnIds
2764:                             .filter(innId => activeCommentaryInningsId === 'all' || activeCommentaryInningsId === innId)
2765:                             .map((innId) => {
2766:                               const innItems = byInnings[innId]; // Do not reverse: keep latest first for over grouping
2767:                               // Group by over
2768:                               const byOver: Record<number, any[]> = {};
2769:                               innItems.forEach((item: any) => {
2770:                                 const ov = item.overNum ?? -1;
2771:                                 if (!byOver[ov]) byOver[ov] = [];
2772:                                 byOver[ov].push(item);
2773:                               });
2774:                               const overKeys = Object.keys(byOver).map(Number).sort((a, b) => b - a);
2775:                               const innName = innItems[0]?.batTeamName ? `${innItems[0].batTeamName} Innings` : `Innings ${innId}`;
2776: 
2777:                               return (
2778:                                 <div key={innId} className="space-y-5">
2779: 
2780: 
2781:                                   {overKeys.map((ov) => {
2782:                                     const overItems = byOver[ov];
2783:                                     const isSpecialOver = ov < 0;
2784:                                     const overSummaryItem = overItems.find(i => i.overSummary || i.event === 'OVER_BREAK');
2785: 
2786:                                     return (
2787:                                       <div key={ov} className="mb-6">
2788:                                         {/* Over Summary Card (Replaces the pill if it exists) */}
2789:                                         {overSummaryItem && overSummaryItem.overSummary ? (
2790:                                             <div className="bg-[#e8f7fa] dark:bg-[#1eb8d1]/10 rounded-t-xl border border-[#cbeef5] dark:border-[#1eb8d1]/20 p-4 mb-0 flex flex-col gap-3 shadow-sm relative overflow-hidden">
2791:                                                {/* Decorator strip */}
2792:                                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#1eb8d1]" />
2793:                                              
2794:                                              {/* Top Row: End of Over, Runs, Score, CRR */}
2795:                                              <div className="flex justify-between items-center pl-2">
2796:                                                 <div className="flex items-baseline gap-2">
2797:                                                    <span className="font-bold text-foreground/90 text-[15px]">End of Over {ov + 1}</span>
2798:                                                    <span className="text-[#1eb8d1] font-bold text-[15px]">{overSummaryItem.overSummary.runs} run{overSummaryItem.overSummary.runs !== '1' ? 's' : ''}</span>
2799:                                                 </div>
2800:                                                 <div className="flex items-center gap-3 text-[13px] font-medium text-foreground/80">
2801:                                                    <span className="font-bold text-foreground">{innItems[0]?.batTeamName ? `${innItems[0].batTeamName}:` : 'Score:'} {overSummaryItem.overSummary.score}</span>
2802:                                                    {overSummaryItem.overSummary.crr && <span>CRR: {overSummaryItem.overSummary.crr}</span>}
2803:                                                 </div>
2804:                                              </div>
2805: 
2806:                                              {/* Second Row: Timeline Balls */}
2807:                                              {overSummaryItem.overSummary.ballsThisOver?.length > 0 && (
2808:                                                 <div className="flex items-center gap-2 pl-2">
2809:                                                    <span className="text-xs font-semibold text-foreground/60 mr-2 uppercase tracking-wider">Ball</span>
2810:                                                    <div className="flex flex-wrap gap-1.5">
2811:                                                      {overSummaryItem.overSummary.ballsThisOver.map((b: string, i: number) => {
2812:                                                          const isW = b.toLowerCase().includes('w');
2813:                                                          return (
2814:                                                              <div key={i} className={cn(
2815:                                                                  "w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black shadow-sm border",
2816:                                                                  isW ? "bg-red-500 text-white border-red-600" : "bg-white dark:bg-card text-foreground/80 border-border/50"
2817:                                                              )}>
2818:                                                                  {b}
2819:                                                              </div>
2820:                                                          );
2821:                                                      })}
2822:                                                    </div>
2823:                                                 </div>
2824:                                              )}
2825: 
2826:                                              <div className="h-px bg-[#cbeef5] dark:bg-[#1eb8d1]/20 my-1" />
2827: 
2828:                                              {/* Third Row: Batter & Bowler Stats */}
2829:                                              <div className="flex flex-col sm:flex-row justify-between pl-2 text-[13px] gap-4 sm:gap-0">
2830:                                                 {/* Batters */}
2831:                                                 <div className="flex flex-col gap-1.5 w-full sm:w-1/2 sm:pr-4 sm:border-r border-[#cbeef5] dark:border-[#1eb8d1]/20">
2832:                                                    {overSummaryItem.overSummary.batsmen?.map((b: any, i: number) => (
2833:                                                        <div key={i} className="flex justify-between items-center">
2834:                                                           <span className="text-foreground/80 underline decoration-foreground/20 underline-offset-2 hover:decoration-foreground/50 cursor-pointer">{b.Name || b.Batsman_Name || `Batter ${i+1}`}</span>
2835:                                                           <span className="font-medium">{b.Runs} <span className="text-muted-foreground font-normal ml-0.5">({b.Balls})</span></span>
2836:                                                        </div>
2837:                                                    ))}
2838:                                                 </div>
2839:                                                 {/* Bowler */}
2840:                                                 <div className="flex flex-col gap-1.5 w-full sm:w-1/2 sm:pl-4">
2841:                                                    {overSummaryItem.overSummary.bowlers?.map((b: any, i: number) => (
2842:                                                        <div key={i} className="flex justify-between items-center">
2843:                                                           <span className="text-foreground/80 underline decoration-foreground/20 underline-offset-2 hover:decoration-foreground/50 cursor-pointer">{b.Name || b.Bowler_Name || `Bowler ${i+1}`}</span>
2844:                                                           <span className="font-medium font-mono text-[12px] text-muted-foreground">{b.Overs}-{b.Maidens}-{b.Runs}-{b.Wickets}</span>
2845:                                                        </div>
2846:                                                    ))}
2847:                                                 </div>
2848:                                              </div>
2849:                                           </div>
2850:                                         ) : !isSpecialOver && (
2851:                                             <div className="flex items-center gap-3 mb-3">
2852:                                               <div className="px-3 py-1 bg-primary/10 text-primary text-[11px] font-bold rounded-full tracking-wide shadow-sm border border-primary/20">
2853:                                                 Over {ov + 1}
2854:                                               </div>
2855:                                               <div className="h-px flex-1 bg-gradient-to-r from-border/50 to-transparent" />
2856:                                             </div>
2857:                                                </div>
2858: 
2859:                                                {/* Second Row: Timeline Balls */}
2860:                                                {overSummaryItem.overSummary.ballsThisOver?.length > 0 && (
2861:                                                   <div className="flex items-center gap-2 pl-2">
2862:                                                      <span className="text-xs font-semibold text-foreground/60 mr-2 uppercase tracking-wider">Ball</span>
2863:                                                      <div className="flex flex-wrap gap-1.5">
2864:                                                        {overSummaryItem.overSummary.ballsThisOver.map((b: string, i: number) => {
2865:                                                            const isW = b.toLowerCase().includes('w');
2866:                                                            return (
2867:                                                                <div key={i} className={cn(
2868:                                                                    "w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black shadow-sm border",
2869:                                                                    isW ? "bg-red-500 text-white border-red-600" : "bg-white dark:bg-card text-foreground/80 border-border/50"
2870:                                                                )}>
2871:                                                                    {b}
2872:                                                                </div>
2873:                                                            );
2874:                                                        })}
2875:                                                      </div>
2876:                                                   </div>
2877:                                                )}
2878: 
2879:                                                <div className="h-px bg-[#cbeef5] dark:bg-[#1eb8d1]/20 my-1" />
2880: 