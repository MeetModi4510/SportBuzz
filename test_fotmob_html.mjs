import axios from 'axios';
async function run() {
  const response = await axios.get('https://www.fotmob.com/transfers');
  console.log('Got HTML of length', response.data.length);
  const match = response.data.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (match) {
    console.log('Found NEXT_DATA');
  } else {
    console.log('No NEXT_DATA');
    // Save to file so we can inspect
    import('fs').then(fs => fs.writeFileSync('fotmob.html', response.data));
  }
}
run();
