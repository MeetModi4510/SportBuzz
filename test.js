import('./server/services/cricbuzzScraperService.js').then(async (cb) => {
    const live = await cb.fetchLiveMatchesScraped();
    const match = live.find(m => m.name.includes('Netherlands') || m.name.includes('Nepal'));
    if (!match) return console.log('Match not found on CB');
    
    console.log('Match id:', match.id);
    
    const cbData = await cb.scrapeFullCommentary(match.id, 'match', true);
    
    if (!cbData || !cbData.commentary) return console.log('No CB data');
    const cbItems = cbData.commentary;
    
    const innCounts = {};
    cbItems.forEach(c => {
        innCounts[c.inningsId] = (innCounts[c.inningsId] || 0) + 1;
    });
    
    console.log('CB innings distribution:', innCounts);
    console.log('Total CB items:', cbItems.length);
    
    // Simulate the minCbByInnings logic
    const minCbByInnings = {};
    cbItems.forEach(c => {
        const inn = c.inningsId;
        const val = (c.overNum || 0) * 100 + (c.ballNbr || 0);
        if (minCbByInnings[inn] === undefined || val < minCbByInnings[inn]) {
            minCbByInnings[inn] = val;
        }
    });
    console.log('minCbByInnings:', minCbByInnings);
    
    // HT data
    import('./server/services/htCommentaryService.js').then(async (ht) => {
        const htComm = await ht.getFullCommentaryFromHT('Netherlands', 'Nepal', new Date().toISOString(), 'odi');
        
        const htInnCounts = {};
        htComm.forEach(c => {
            htInnCounts[c.inningsId] = (htInnCounts[c.inningsId] || 0) + 1;
        });
        console.log('\nHT innings distribution:', htInnCounts);
        
        // Simulate what frontend sees
        const uniqueHtItems = htComm.filter(h => {
            const inn = h.inningsId;
            if (minCbByInnings[inn] === undefined) return true; // No CB for this innings
            const val = (h.overNum || 0) * 100 + (h.ballNbr || 0);
            return val < minCbByInnings[inn];
        });
        
        const mergedInnCounts = {};
        [...cbItems, ...uniqueHtItems].forEach(c => {
            mergedInnCounts[c.inningsId] = (mergedInnCounts[c.inningsId] || 0) + 1;
        });
        console.log('\nFinal merged innings distribution:', mergedInnCounts);
    });
});
