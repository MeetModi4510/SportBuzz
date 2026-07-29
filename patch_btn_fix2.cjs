const fs = require('fs');
let src = fs.readFileSync('src/pages/MatchDetails.tsx', 'utf8');

// The button is after </div> (closing space-y-8), with an extra </div> after it.
// Structure currently:
//   })}            <- closes displayInnIds.map
//                  <- blank
//   </div>         <- closes space-y-8 div  ← WRONG PLACE
//                  <- blank  
//   {/* button */}
//   {!htComm && (...button...)}
//   </div>         <- extra div that shouldn't be here
//   );
//   })()
//   ) : cbCommentaryField...

// We need:
//   })}            <- closes displayInnIds.map
//   {/* button */}
//   {!htComm && (...button...)}
//   </div>         <- closes space-y-8 div
//   );
//   })()
//   ) : cbCommentaryField...

const broken = `                            })}\r\n\r\n                        </div>\r\n\r\n                          {/* Load Full Historical Commentary button */}\r\n                          {!htComm && (\r\n                            <div className="flex flex-col items-center gap-2 mt-6 mb-4">\r\n                              <button\r\n                                onClick={() => fetchHtData(false, team1Name || '', team2Name || '', (match as any)?.matchType || '', (match as any)?.matchStartDate || '')}\r\n                                disabled={htLoading}\r\n                                className="px-6 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-full font-semibold transition-colors flex items-center gap-2"\r\n                              >\r\n                                {htLoading && <Loader2 className="w-4 h-4 animate-spin" />}\r\n                                {htLoading ? 'Loading Full Commentary...' : 'Load Full Historical Commentary'}\r\n                              </button>\r\n                              {htError && <p className="text-red-400 text-sm text-center">{htError}</p>}\r\n                            </div>\r\n                          )}\r\n                        </div>\r\n                      );\r\n                    })()\r\n                  ) : cbCommentaryField.data?.commentary`;

const fixed = `                            })}\r\n\r\n                          {/* Load Full Historical Commentary button */}\r\n                          {!htComm && (\r\n                            <div className="flex flex-col items-center gap-2 mt-6 mb-4">\r\n                              <button\r\n                                onClick={() => fetchHtData(false, team1Name || '', team2Name || '', (match as any)?.matchType || '', (match as any)?.matchStartDate || '')}\r\n                                disabled={htLoading}\r\n                                className="px-6 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-full font-semibold transition-colors flex items-center gap-2"\r\n                              >\r\n                                {htLoading && <Loader2 className="w-4 h-4 animate-spin" />}\r\n                                {htLoading ? 'Loading Full Commentary...' : 'Load Full Historical Commentary'}\r\n                              </button>\r\n                              {htError && <p className="text-red-400 text-sm text-center">{htError}</p>}\r\n                            </div>\r\n                          )}\r\n                        </div>\r\n                      );\r\n                    })()\r\n                  ) : cbCommentaryField.data?.commentary`;

if (src.includes(broken)) {
  src = src.replace(broken, fixed);
  fs.writeFileSync('src/pages/MatchDetails.tsx', src);
  console.log('✅ Fixed! Button is now correctly inside the space-y-8 div, extra </div> removed.');
} else {
  console.log('❌ Pattern not found, showing context...');
  const idx = src.indexOf('Load Full Historical Commentary button');
  console.log(JSON.stringify(src.slice(idx - 250, idx + 700)));
}
