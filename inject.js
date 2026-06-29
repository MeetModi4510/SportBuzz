const fs = require('fs');
const file = 'd:/dev_scripts/index.html';
let html = fs.readFileSync(file, 'utf8');
html = html.replace('</head>', '<script>window.onerror = function(msg, src, line, col, err) { document.body.innerHTML = `<h1 style="color:red; background:white; z-index:9999; position:absolute;">` + msg + `<br/>` + (err && err.stack) + `</h1>`; };</script></head>');
fs.writeFileSync(file, html);
