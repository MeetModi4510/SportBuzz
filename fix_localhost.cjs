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
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('http://localhost:5000')) {
          results.push(file);
        }
      }
    }
  });
  return results;
}

const files = walk('src');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace in template literals: `http://localhost:5000...` -> `${import.meta.env.PROD ? '' : 'http://localhost:5000'}...`
  // Replace in normal strings: 'http://localhost:5000...' -> import.meta.env.PROD ? '' : 'http://localhost:5000' + '...'
  
  // Simplest approach: Replace all 'http://localhost:5000' with import.meta.env.PROD ? '' : 'http://localhost:5000'
  // But we have to be careful about quotes. Let's just do a regex replace that handles quotes.

  content = content.replace(/'http:\/\/localhost:5000\//g, "(import.meta.env.PROD ? '/' : 'http://localhost:5000/')");
  content = content.replace(/"http:\/\/localhost:5000\//g, "(import.meta.env.PROD ? '/' : 'http://localhost:5000/')");
  content = content.replace(/`http:\/\/localhost:5000\//g, "`${import.meta.env.PROD ? '/' : 'http://localhost:5000/'}");

  // for those without trailing slash
  content = content.replace(/'http:\/\/localhost:5000'/g, "(import.meta.env.PROD ? '' : 'http://localhost:5000')");
  content = content.replace(/"http:\/\/localhost:5000"/g, "(import.meta.env.PROD ? '' : 'http://localhost:5000')");
  content = content.replace(/`http:\/\/localhost:5000`/g, "`${import.meta.env.PROD ? '' : 'http://localhost:5000'}`");

  // In `api.ts`, there's a specific block that we might mess up. Let's check api.ts explicitly.
  if (file.endsWith('api.ts')) {
     // Revert any changes to api.ts because it has its own logic
     return;
  }
  
  fs.writeFileSync(file, content);
});
console.log('Modified ' + files.length + ' files.');
