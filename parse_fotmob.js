import fs from 'fs';

const html = fs.readFileSync('C:/Users/kolad/.gemini/antigravity-ide/brain/6d8e3470-3825-4258-be1e-906bb90e8ca5/fotmob_scrape_output.html', 'utf8');
const startTag = '<script id="__NEXT_DATA__" type="application/json">';
const startIndex = html.indexOf(startTag);
if (startIndex !== -1) {
  const contentStart = startIndex + startTag.length;
  const endIndex = html.indexOf('</script>', contentStart);
  const jsonStr = html.substring(contentStart, endIndex);
  const data = JSON.parse(jsonStr);
  const payload = data.props.pageProps.fallback['/api/teams?id=6706'];
  fs.writeFileSync('fotmob_schema.json', JSON.stringify(payload, null, 2));
  console.log('Extracted to fotmob_schema.json');
  console.log('Keys:', Object.keys(payload));
} else {
  console.log('Not found');
}
