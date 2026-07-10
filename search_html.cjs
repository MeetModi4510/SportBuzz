const fs = require('fs');
const html = fs.readFileSync('fotmob.html', 'utf8');
const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
if (match) {
  const data = JSON.parse(match[1]);
  const str = JSON.stringify(data);
  if (str.includes('Brais') || str.includes('Elliot')) {
    console.log('Found names in NEXT_DATA!');
  } else {
    console.log('Names NOT found in NEXT_DATA.');
  }
} else {
  if (html.includes('Brais')) {
    console.log('Found names in raw HTML!');
  }
}
