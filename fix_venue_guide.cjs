const fs = require('fs');
let content = fs.readFileSync('src/pages/MatchDetails.tsx', 'utf-8');

const target1 = `                        </div>
                      </div>

                      {/* Man of the Match (Full Width Footer) */}`;

const replacement1 = `                        </div>
                      </div>

                      {/* Venue Guide */}
                      {(() => {
                        const vg = cbInfo?.venueGuide || cbSummary?.venueGuide;
                        if (!vg) return null;
                        return (
                          <div className="mt-8 border border-border/50 bg-secondary/20 rounded-3xl overflow-hidden">
                            <div className="bg-secondary/40 px-6 py-4 border-b border-border/50">
                              <h3 className="text-sm font-bold text-foreground/80 uppercase tracking-widest flex items-center gap-2">
                                <MapPin size={16} className="text-primary"/> Venue Guide
                              </h3>
                            </div>
                            <div className="p-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                                <div className="flex justify-between border-b border-border/30 pb-2">
                                  <span className="text-muted-foreground font-semibold">Stadium</span>
                                  <span className="text-foreground font-medium text-right">{vg.stadium || "Unknown"}</span>
                                </div>
                                <div className="flex justify-between border-b border-border/30 pb-2">
                                  <span className="text-muted-foreground font-semibold">City</span>
                                  <span className="text-foreground font-medium text-right">{vg.city || "Unknown"}</span>
                                </div>
                                <div className="flex justify-between border-b border-border/30 pb-2">
                                  <span className="text-muted-foreground font-semibold">Capacity</span>
                                  <span className="text-foreground font-medium text-right">{vg.capacity || "Unknown"}</span>
                                </div>
                                <div className="flex justify-between border-b border-border/30 pb-2">
                                  <span className="text-muted-foreground font-semibold">Ends</span>
                                  <span className="text-foreground font-medium text-right">{vg.ends || "Unknown"}</span>
                                </div>
                                <div className="flex justify-between md:col-span-2 border-b border-border/30 pb-2">
                                  <span className="text-muted-foreground font-semibold">Hosts To</span>
                                  <span className="text-foreground font-medium text-right">{vg.hostsTo || "Unknown"}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Man of the Match (Full Width Footer) */}`;

content = content.replace(target1, replacement1);

const refTarget = `{cbInfo?.matchInfo?.referee?.name || match.referee || "To be announced"}`;
const refReplace = `{ref?.name || match.referee || "To be announced"}`;
content = content.replace(refTarget, refReplace);

fs.writeFileSync('src/pages/MatchDetails.tsx', content);
console.log('Inserted Venue Guide');
