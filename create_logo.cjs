const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  const svgContent = fs.readFileSync('public/favicon.svg', 'utf8');
  
  // Render 512x512
  await page.setViewport({ width: 512, height: 512 });
  let html512 = `
    <!DOCTYPE html>
    <html>
      <body style="margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; width: 512px; height: 512px; background: transparent;">
        ${svgContent.replace(/width="64"/, 'width="512"').replace(/height="64"/, 'height="512"')}
      </body>
    </html>
  `;
  await page.setContent(html512);
  await page.screenshot({ path: 'public/logo-512.png', omitBackground: true });

  // Render 192x192
  await page.setViewport({ width: 192, height: 192 });
  let html192 = `
    <!DOCTYPE html>
    <html>
      <body style="margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; width: 192px; height: 192px; background: transparent;">
        ${svgContent.replace(/width="64"/, 'width="192"').replace(/height="64"/, 'height="192"')}
      </body>
    </html>
  `;
  await page.setContent(html192);
  await page.screenshot({ path: 'public/logo-192.png', omitBackground: true });

  await browser.close();
})();
