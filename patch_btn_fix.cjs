const fs = require('fs');
let src = fs.readFileSync('src/pages/MatchDetails.tsx', 'utf8');

// The button is currently OUTSIDE the space-y-8 div (after its closing tag).
// We need to move it INSIDE — i.e., remove it from after </div> and put it before </div>.

// 1. Remove the button from its current (wrong) location — it's between </div> and );
const wrongPlacement = 
`\r\n\r\n                        {/* Load Full Historical Commentary button */}\r\n                        {!htComm && (\r\n                          <div className="flex flex-col items-center gap-2 mt-6 mb-4">\r\n                            <button\r\n                              onClick={() => fetchHtData(false, team1Name || '', team2Name || '', (match as any)?.matchType || '', (match as any)?.matchStartDate || '')}\r\n                              disabled={htLoading}\r\n                              className="px-6 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-full font-semibold transition-colors flex items-center gap-2"\r\n                            >\r\n                              {htLoading && <Loader2 className="w-4 h-4 animate-spin" />}\r\n                              {htLoading ? 'Loading Full Commentary...' : 'Load Full Historical Commentary'}\r\n                            </button>\r\n                            {htError && <p className="text-red-400 text-sm text-center">{htError}</p>}\r\n                          </div>\r\n                        )}\r\n                      );\r\n                    })()\r\n                  ) : cbCommentaryField.data?.commentary`;

// 2. The correct placement — inside space-y-8 div, before its closing tag
const correctPlacement =
`\r\n\r\n                          {/* Load Full Historical Commentary button */}\r\n                          {!htComm && (\r\n                            <div className="flex flex-col items-center gap-2 mt-6 mb-4">\r\n                              <button\r\n                                onClick={() => fetchHtData(false, team1Name || '', team2Name || '', (match as any)?.matchType || '', (match as any)?.matchStartDate || '')}\r\n                                disabled={htLoading}\r\n                                className="px-6 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-full font-semibold transition-colors flex items-center gap-2"\r\n                              >\r\n                                {htLoading && <Loader2 className="w-4 h-4 animate-spin" />}\r\n                                {htLoading ? 'Loading Full Commentary...' : 'Load Full Historical Commentary'}\r\n                              </button>\r\n                              {htError && <p className="text-red-400 text-sm text-center">{htError}</p>}\r\n                            </div>\r\n                          )}\r\n                        </div>\r\n                      );\r\n                    })()\r\n                  ) : cbCommentaryField.data?.commentary`;

if (src.includes(wrongPlacement)) {
  src = src.replace(wrongPlacement, correctPlacement);
  console.log('✅ Button moved inside the space-y-8 div');
} else {
  console.log('❌ Could not find the wrong placement string');
  // Debug: show what's around the button
  const idx = src.indexOf('Load Full Historical Commentary button');
  console.log('Context:', JSON.stringify(src.slice(idx - 100, idx + 200)));
}

fs.writeFileSync('src/pages/MatchDetails.tsx', src);
