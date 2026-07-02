const fs = require('fs');
const https = require('https');
const path = require('path');

const download = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
};

async function run() {
  const logosDir = path.join(__dirname, 'public', 'images', 'logos');
  if (!fs.existsSync(logosDir)) {
      fs.mkdirSync(logosDir, { recursive: true });
  }

  const files = {
    'cwc.png': 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e4/UEFA_Cup_Winners%27_Cup_logo.svg/200px-UEFA_Cup_Winners%27_Cup_logo.svg.png',
    'fairs.png': 'https://upload.wikimedia.org/wikipedia/en/thumb/8/87/Inter-Cities_Fairs_Cup_logo.svg/200px-Inter-Cities_Fairs_Cup_logo.svg.png',
    'supercup.png': 'https://upload.wikimedia.org/wikipedia/en/thumb/4/41/UEFA_Super_Cup_logo.svg/200px-UEFA_Super_Cup_logo.svg.png',
    'shield.png': 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a2/FA_Community_Shield.svg/200px-FA_Community_Shield.svg.png'
  };

  for (const [filename, url] of Object.entries(files)) {
    try {
      await download(url, path.join(logosDir, filename));
      console.log(`Downloaded ${filename}`);
    } catch (e) {
      console.error(`Failed ${filename}:`, e.message);
    }
  }
}
run();
