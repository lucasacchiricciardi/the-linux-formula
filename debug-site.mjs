import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';

const DIST_DIR = 'dist';
const PORT = 8765;

// Simple static file server
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml'
};

const server = createServer((req, res) => {
  let filePath = join(DIST_DIR, req.url === '/' ? 'index.html' : req.url);
  if (!existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  const ext = extname(filePath);
  res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
  res.end(readFileSync(filePath));
});

server.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome'
  });
  
  const page = await browser.newPage();
  
  // Collect ALL console messages
  page.on('console', msg => {
    console.log(`[CONSOLE ${msg.type()}]`, msg.text());
  });
  
  // Collect page errors with stack
  page.on('pageerror', err => {
    console.log('[PAGE ERROR]', err.name, err.message);
  });
  
  console.log('\n=== NAVIGATING ===');
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load', timeout: 30000 });
  
  // Wait for scripts
  await page.waitForTimeout(3000);
  
  console.log('\n=== CHECK SCRIPTS ===');
  const scriptsInfo = await page.evaluate(() => {
    const scripts = Array.from(document.querySelectorAll('script[src]')).map(s => s.src);
    const lzString = typeof LZString;
    const analytics = typeof window.LimesAnalytics;
    return { scripts, lzString, analytics };
  });
  console.log('Scripts loaded:', scriptsInfo.scripts);
  console.log('LZString:', scriptsInfo.lzString);
  console.log('Analytics:', scriptsInfo.analytics);
  
  console.log('\n=== CHECK LOCALSTORAGE ===');
  const lsKeys = await page.evaluate(() => Object.keys(localStorage));
  console.log('LS keys:', lsKeys);
  
  console.log('\n=== DONE ===');
  await browser.close();
  server.close();
});