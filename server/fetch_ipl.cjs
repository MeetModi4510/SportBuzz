const axios = require('axios'); axios.get('https://stats.espncricinfo.com/ci/engine/records/index.html?id=117;type=trophy').then(res => require('fs').writeFileSync('ipl.html', res.data));
