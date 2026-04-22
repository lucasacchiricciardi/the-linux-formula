import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome'
  });
  
  const page = await browser.newPage();
  
  console.log('=== NAVIGATING ===');
  await page.goto('http://localhost:8888/', { waitUntil: 'load', timeout: 30000 });
  
  // Wait for auth to initialize
  await page.waitForTimeout(2000);
  
  console.log('\n=== CHECK AUTH ===');
  const hasAuthRequired = await page.evaluate(() => 
    document.body.classList.contains('tlf-auth-required')
  );
  console.log('Auth required:', hasAuthRequired);
  
  const overlay = await page.$('.tlf-auth-overlay');
  const modal = await page.$('.tlf-auth-modal');
  console.log('Overlay visible:', !!overlay);
  console.log('Modal visible:', !!modal);
  
  console.log('\n=== DONE ===');
  await browser.close();
})();