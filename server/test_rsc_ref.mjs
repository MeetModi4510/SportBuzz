import axios from 'axios';

const url = 'https://www.cricbuzz.com/live-cricket-full-commentary/129563/eng-vs-nz-2nd-test-new-zealand-tour-of-england-2026';
const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,*/*',
  'Referer': 'https://www.cricbuzz.com/'
};

try {
  const res = await axios.get(url, { headers, timeout: 15000 });
  const html = res.data;

  // Extract the RSC payload
  const marker = '"matchPreviewFullComm":{';
  const mpIdx = html.indexOf(marker);
  
  const scriptStart = html.lastIndexOf('self.__next_f.push', mpIdx);
  const scriptClose = html.indexOf('</script>', scriptStart);
  const rawScript = html.substring(scriptStart, scriptClose);
  const payloadMatch = rawScript.match(/self\.__next_f\.push\(\[1,"([\s\S]+?)"\]\)/);
  
  let unescaped;
  try {
      unescaped = JSON.parse('"' + payloadMatch[1] + '"');
  } catch (_) {
      unescaped = payloadMatch[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  }

  const objStart = unescaped.indexOf(marker) + '"matchPreviewFullComm":'.length;
  let braces = 0;
  let objEnd = objStart;
  for (let i = objStart; i < unescaped.length; i++) {
      if (unescaped[i] === '{') braces++;
      else if (unescaped[i] === '}') braces--;
      if (braces === 0 && i > objStart) { objEnd = i + 1; break; }
  }

  const mpObj = JSON.parse(unescaped.substring(objStart, objEnd));
  
  const refs = new Set();
  for (const inn of mpObj.commentary || []) {
      for (const item of inn.commentaryList || []) {
          if (item.commText && item.commText.startsWith('$')) {
              refs.add(item.commText);
          }
      }
  }
  
  console.log('Found $ references:', [...refs]);

} catch (e) {
  console.error(e.message);
}
