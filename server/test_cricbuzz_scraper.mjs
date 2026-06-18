import fs from 'fs';
const packagePath = 'd:\\dev_scripts\\server\\node_modules\\cricbuzz-scraper\\index.js';
if (fs.existsSync(packagePath)) {
    console.log(fs.readFileSync(packagePath, 'utf8'));
} else {
    console.log('File not found');
}
