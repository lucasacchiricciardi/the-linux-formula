import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome'
  });
  
  const page = await browser.newPage();
  
  console.log('=== NAVIGATING ===');
  await page.goto('https://lucasacchiricciardi.github.io/the-linux-formula/', { waitUntil: 'load', timeout: 30000 });
  
  // Check overlay visibility
  const overlay = await page.$('.tlf-auth-overlay');
  const modal = await page.$('.tlf-auth-modal');
  const authRequired = await page.evaluate(() => document.body.classList.contains('tlf-auth-required'));
  
  console.log('Auth overlay present:', !!overlay);
  console.log('Auth modal present:', !!modal);
  console.log('Body has tlf-auth-required:', authRequired);
  
  // Check secret.json
  const secretCheck = await page.evaluate(async () => {
    try {
      const resp = await fetch('secret.json');
      return resp.status;
    } catch(e) {
      return 404;
    }
  });
  console.log('secret.json HTTP status:', secretCheck);
  
  // Check if content is visible
  const articles = await page.$$('#news-feed-articles article');
  console.log('Articles visible:', articles.length);
  
  console.log('\n=== DONE ===');
  await browser.close();
})();
