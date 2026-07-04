import axios from 'axios';
import fs from 'fs';
async function run() {
  const response = await axios.get('https://www.fotmob.com/transfers');
  const match = response.data.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (match) {
    const nextData = JSON.parse(match[1]);
    const transfersData = nextData?.props?.pageProps?.transfers?.data;
    if (!transfersData || !Array.isArray(transfersData)) {
        console.log('Transfers data missing or not an array. Keys of pageProps:', Object.keys(nextData?.props?.pageProps || {}));
        fs.writeFileSync('next_data.json', JSON.stringify(nextData, null, 2));
    } else {
        console.log('Transfers data found! length:', transfersData.length);
    }
  }
}
run();
