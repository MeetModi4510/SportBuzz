const fs = require('fs');
let content = fs.readFileSync('src/pages/MatchDetails.tsx', 'utf-8');

// 1. Replace Batsman logic
const batTarget = `{cbSummary.miniscore.batsman.map((bat: any, idx: number) => (
                                  <tr key={idx} className="hover:bg-muted/5 transition-colors">
                                    <td className="px-6 py-4 font-semibold text-foreground flex items-center gap-2">
                                      {bat.batName} {bat.batName === cbSummary.miniscore.batsmanStriker?.batName && <span className="text-primary">*</span>}
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold">{bat.batRuns}</td>
                                    <td className="px-6 py-4 text-right text-muted-foreground">{bat.batBalls}</td>
                                    <td className="px-6 py-4 text-right text-muted-foreground">{bat.batFours}</td>
                                    <td className="px-6 py-4 text-right text-muted-foreground">{bat.batSixes}</td>
                                    <td className="px-6 py-4 text-right text-muted-foreground">{bat.batStrikeRate}</td>
                                  </tr>
                                ))}`;

const batReplace = `{[cbSummary.miniscore.batsmanStriker, cbSummary.miniscore.batsmanNonStriker].filter(Boolean).map((bat: any, idx: number) => (
                                  <tr key={idx} className="hover:bg-muted/5 transition-colors">
                                    <td className="px-6 py-4 font-semibold text-foreground flex items-center gap-2">
                                      {bat.name} {bat.id === cbSummary.miniscore.batsmanStriker?.id && <span className="text-primary">*</span>}
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold">{bat.runs}</td>
                                    <td className="px-6 py-4 text-right text-muted-foreground">{bat.balls}</td>
                                    <td className="px-6 py-4 text-right text-muted-foreground">{bat.fours}</td>
                                    <td className="px-6 py-4 text-right text-muted-foreground">{bat.sixes}</td>
                                    <td className="px-6 py-4 text-right text-muted-foreground">{bat.strikeRate}</td>
                                  </tr>
                                ))}`;

content = content.replace(batTarget, batReplace);
content = content.replace(`{cbSummary.miniscore?.batsman && (`, `{(cbSummary.miniscore?.batsmanStriker || cbSummary.miniscore?.batsmanNonStriker) && (`);

// 2. Replace Bowler logic
const bowlTarget = `{cbSummary.miniscore.bowler.map((bowl: any, idx: number) => (
                                  <tr key={idx} className="hover:bg-muted/5 transition-colors">
                                    <td className="px-6 py-4 font-semibold text-foreground flex items-center gap-2">
                                      {bowl.bowlName} {bowl.bowlName === cbSummary.miniscore.bowlerStriker?.bowlName && <span className="text-primary">*</span>}
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold">{bowl.bowlOvs}</td>
                                    <td className="px-6 py-4 text-right text-muted-foreground">{bowl.bowlMaidens}</td>
                                    <td className="px-6 py-4 text-right text-muted-foreground">{bowl.bowlRuns}</td>
                                    <td className="px-6 py-4 text-right font-bold text-red-500">{bowl.bowlWkts}</td>
                                    <td className="px-6 py-4 text-right text-muted-foreground">{bowl.bowlEcon}</td>
                                  </tr>
                                ))}`;

const bowlReplace = `{[cbSummary.miniscore.bowlerStriker, cbSummary.miniscore.bowlerNonStriker].filter(Boolean).map((bowl: any, idx: number) => (
                                  <tr key={idx} className="hover:bg-muted/5 transition-colors">
                                    <td className="px-6 py-4 font-semibold text-foreground flex items-center gap-2">
                                      {bowl.name} {bowl.id === cbSummary.miniscore.bowlerStriker?.id && <span className="text-primary">*</span>}
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold">{bowl.overs}</td>
                                    <td className="px-6 py-4 text-right text-muted-foreground">{bowl.maidens}</td>
                                    <td className="px-6 py-4 text-right text-muted-foreground">{bowl.runs}</td>
                                    <td className="px-6 py-4 text-right font-bold text-red-500">{bowl.wickets}</td>
                                    <td className="px-6 py-4 text-right text-muted-foreground">{bowl.economy}</td>
                                  </tr>
                                ))}`;

content = content.replace(bowlTarget, bowlReplace);
content = content.replace(`{cbSummary.miniscore?.bowler && (`, `{(cbSummary.miniscore?.bowlerStriker || cbSummary.miniscore?.bowlerNonStriker) && (`);

// 3. Add Win Probability
const winProbReplace = `
                          {/* Last 10 Overs */}
                          {cbSummary.miniscore?.last10Overs && (
                            <div>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Last 10 Overs</p>
                              <p className="font-semibold text-sm text-foreground">{cbSummary.miniscore.last10Overs}</p>
                            </div>
                          )}

                          {/* Win Probability */}
                          {cbSummary.winProbability && (
                            <div className="pt-4 border-t border-border/30">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Win Probability</p>
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-foreground w-8">{cbSummary.winProbability.team1?.shortName || "T1"}</span>
                                <div className="flex-1 h-2.5 flex rounded-full overflow-hidden bg-muted">
                                  <div className="bg-primary h-full" style={{ width: \`\${cbSummary.winProbability.team1?.percent || 0}%\` }} />
                                  <div className="bg-secondary h-full" style={{ width: \`\${cbSummary.winProbability.drawTiePercent || 0}%\` }} />
                                  <div className="bg-[#1e293b] h-full" style={{ width: \`\${cbSummary.winProbability.team2?.percent || 0}%\` }} />
                                </div>
                                <span className="text-xs font-bold text-foreground w-8 text-right">{cbSummary.winProbability.team2?.shortName || "T2"}</span>
                              </div>
                              <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5 font-medium px-11">
                                <span>{cbSummary.winProbability.team1?.percent || 0}%</span>
                                {cbSummary.winProbability.drawTiePercent > 0 && <span>Draw {cbSummary.winProbability.drawTiePercent}%</span>}
                                <span>{cbSummary.winProbability.team2?.percent || 0}%</span>
                              </div>
                            </div>
                          )}
`;

content = content.replace(`
                          {/* Last 10 Overs */}
                          {cbSummary.miniscore?.last10Overs && (
                            <div>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Last 10 Overs</p>
                              <p className="font-semibold text-sm text-foreground">{cbSummary.miniscore.last10Overs}</p>
                            </div>
                          )}`, winProbReplace);


fs.writeFileSync('src/pages/MatchDetails.tsx', content);
console.log('Replaced Batter, Bowler, and Win Probability logic');
