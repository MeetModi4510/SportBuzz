const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('src');
let count = 0;

files.forEach(file => {
  const original = fs.readFileSync(file, 'utf8');
  let content = original;

  if (!content.includes('http://localhost:5000')) {
    return;
  }
  
  if (content.includes('? "" : "http://localhost:5000"') || content.includes("? '' : 'http://localhost:5000'")) {
    return;
  }

  // Template literals: `http://localhost:5000...` -> `${import.meta.env.PROD ? "" : "http://localhost:5000"}...`
  content = content.replace(/`http:\/\/localhost:5000\/?/g, "`${import.meta.env.PROD ? \"\" : \"http://localhost:5000\"}/");
  
  // Single quotes: 'http://localhost:5000...' -> (import.meta.env.PROD ? '' : 'http://localhost:5000') + '/...'
  content = content.replace(/'http:\/\/localhost:5000\/?/g, "(import.meta.env.PROD ? '' : 'http://localhost:5000') + '/");
  
  // Double quotes: "http://localhost:5000..." -> (import.meta.env.PROD ? "" : "http://localhost:5000") + "/..."
  content = content.replace(/"http:\/\/localhost:5000\/?/g, "(import.meta.env.PROD ? \"\" : \"http://localhost:5000\") + \"/");

  // Fix trailing quotes if there was no path after the domain
  content = content.replace(/ \+ '\/'/g, "");
  content = content.replace(/ \+ "\/"/g, "");

  if (content !== original) {
    if (!file.endsWith('api.ts') && !file.endsWith('apiClient.ts')) {
      fs.writeFileSync(file, content);
      count++;
    }
  }
});

console.log('Modified ' + count + ' files.');
