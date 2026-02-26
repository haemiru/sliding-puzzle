const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 1600 });

  const htmlPath = path.resolve(__dirname, '..', 'output', 'claude-ebook-guide-by-jm.html');
  const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/');
  await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 30000 });

  const imageStatus = await page.evaluate(() => {
    const imgs = document.querySelectorAll('img');
    return Array.from(imgs).map(img => ({
      src: img.src.split('/').slice(-2).join('/'),
      loaded: img.complete && img.naturalWidth > 0,
      width: img.naturalWidth,
      height: img.naturalHeight
    }));
  });

  console.log('=== Image Loading Status ===');
  imageStatus.forEach(img => {
    const status = img.loaded ? 'OK  ' : 'FAIL';
    console.log(`  [${status}] ${img.src} (${img.width}x${img.height})`);
  });

  const loaded = imageStatus.filter(i => i.loaded).length;
  console.log(`\nTotal: ${loaded}/${imageStatus.length} images loaded`);

  await browser.close();
  process.exit(loaded === imageStatus.length ? 0 : 1);
})();
