const fs = require('fs');
let src = fs.readFileSync('src/pages/MatchDetails.tsx', 'utf8');

// ──────────────────────────────────────────────────────────────────
// 1. Fix "Innings Header" — hide when not using HT commentary
//    Use exact CRLF strings from the file
// ──────────────────────────────────────────────────────────────────
const innOld = `{/* Innings Header */}\r\n                                  <div className="sticky top-0 z-10 bg-card border-b border-border/50 py-3 mb-4 backdrop-blur-md bg-opacity-90">\r\n                                    <h4 className="font-bold text-foreground tracking-tight px-1 flex items-center gap-2">\r\n                                      <div className="w-1.5 h-4 bg-primary rounded-full"></div>\r\n                                      {innName}\r\n                                    </h4>\r\n                                  </div>`;
const innNew = `{/* Innings Header — only for HT multi-innings data */}\r\n                                  {!!htComm && displayInnIds.length > 1 && (\r\n                                    <div className="sticky top-0 z-10 bg-card border-b border-border/50 py-3 mb-4 backdrop-blur-md bg-opacity-90">\r\n                                      <h4 className="font-bold text-foreground tracking-tight px-1 flex items-center gap-2">\r\n                                        <div className="w-1.5 h-4 bg-primary rounded-full"></div>\r\n                                        {innName}\r\n                                      </h4>\r\n                                    </div>\r\n                                  )}`;

if (src.includes(innOld)) {
  src = src.replace(innOld, innNew);
  console.log('✅ Innings header patched');
} else {
  console.log('❌ Innings header NOT found');
}

// ──────────────────────────────────────────────────────────────────
// 2. Add "Load Full Historical Commentary" button before IIFE end
// ──────────────────────────────────────────────────────────────────
const iifeOld = `</div>\r\n                      );\r\n                    })()\r\n                  ) : cbCommentaryField.data?.commentary`;
const iifeNew = `</div>\r\n\r\n                        {/* Load Full Historical Commentary button */}\r\n                        {!htComm && (\r\n                          <div className="flex flex-col items-center gap-2 mt-6 mb-4">\r\n                            <button\r\n                              onClick={() => fetchHtData(false, team1Name || '', team2Name || '', (match as any)?.matchType || '', (match as any)?.matchStartDate || '')}\r\n                              disabled={htLoading}\r\n                              className="px-6 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-full font-semibold transition-colors flex items-center gap-2"\r\n                            >\r\n                              {htLoading && <Loader2 className="w-4 h-4 animate-spin" />}\r\n                              {htLoading ? 'Loading Full Commentary...' : 'Load Full Historical Commentary'}\r\n                            </button>\r\n                            {htError && <p className="text-red-400 text-sm text-center">{htError}</p>}\r\n                          </div>\r\n                        )}\r\n                      );\r\n                    })()\r\n                  ) : cbCommentaryField.data?.commentary`;

if (src.includes(iifeOld)) {
  src = src.replace(iifeOld, iifeNew);
  console.log('✅ Button injected');
} else {
  console.log('❌ IIFE end NOT found');
}

// ──────────────────────────────────────────────────────────────────
// 3. Fix all mojibake
// ──────────────────────────────────────────────────────────────────
src = src.replace(/Γÿ¥∩╕Å/g, 'W');
src = src.replace(/6∩╕ÅΓâú/g, '6');
src = src.replace(/4∩╕ÅΓâú/g, '4');
src = src.replace(/≡ƒÅÅ/g, 'W');
src = src.replace(/Γåö∩╕Å/g, 'WD');
console.log('✅ Mojibake fixed');

fs.writeFileSync('src/pages/MatchDetails.tsx', src);
console.log('Done!');
