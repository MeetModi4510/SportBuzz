import https from 'https';

function check(id) {
  https.get(`https://stats.espncricinfo.com/ci/engine/stats/index.html?class=1;ground=${id};template=results;type=aggregate;view=ground`, res => {
    let d = ''; res.on('data', c => d+=c); res.on('end', () => {
      const match = d.match(/<tr class="data1">.*?<a href="\/ci\/engine\/ground\/\d+\.html">([^<]+)<\/a>/s);
      if (match) console.log(id, match[1]);
    });
  });
}

// Searching common IDs
for (let i = 1; i < 600; i++) {
    check(i);
}
