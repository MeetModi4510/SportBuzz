import fs from 'fs'; 
const html = fs.readFileSync('ht_live_score.html', 'utf8'); 
const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/); 
if (nextDataMatch) { 
    console.log('Found __NEXT_DATA__ length:', nextDataMatch[1].length); 
    fs.writeFileSync('ht_live_score.json', nextDataMatch[1]); 
    const nextData = JSON.parse(nextDataMatch[1]);
    console.log('liveData:', nextData.props?.pageProps?.liveData?.length || 0);
    console.log('upcomingMatchData:', nextData.props?.pageProps?.upcomingMatchData?.length || 0);
    if(nextData.props?.pageProps?.liveData?.length > 0) {
        console.log('Sample Live Match:', JSON.stringify(nextData.props.pageProps.liveData[0]).substring(0, 300));
    }
} else { 
    console.log('__NEXT_DATA__ not found'); 
}
