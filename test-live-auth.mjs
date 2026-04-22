import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome'
  });
  
  const page = await browser.newPage();
  
  // Collect console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  
  console.log('=== NAVIGATING TO LIVE SITE ===');
  await page.goto('https://lucasacchiricciardi.github.io/the-linux-formula/', { waitUntil: 'load', timeout: 30000 });
  
  // Wait a bit for any async initialization
  await page.waitForTimeout(2000);
  
  console.log('\n=== CHECKING AUTH STATE ===');
  const bodyClasses = await page.evaluate(() => document.body.className);
  const hasAuthRequired = bodyClasses.includes('tlf-auth-required');
  console.log('Body has tlf-auth-required:', hasAuthRequired);
  
  const overlay = await page.$('.tlf-auth-overlay');
  const modal = await page.$('.tlf-auth-modal');
  console.log('Auth overlay present:', !!overlay);
  console.log('Auth modal present:', !!modal);
  
  // Check for secret.json
  const secretExists = await page.evaluate(async () => {
    try {
      const resp = await fetch('secret.json');
      return resp.ok;
    } catch {
      return false;
    }
  });
  console.log('secret.json exists:', secretExists);
  
  if (hasAuthRequired && overlay && modal) {
    console.log('\n=== AUTH GATE ACTIVE ===');
    
    // Check if the input is present
    const input = await page.$('#tlf-auth-input');
    if (input) {
      console.log('Password input found');
      
      // Type the password
      await input.fill('luca');
      console.log('Entered password: luca');
      
      // Click the Unlock button
      const unlockButton = await page.$('#tlf-auth-button');
      if (unlockButton) {
        await unlockButton.click();
        console.log('Clicked Unlock button');
        
        // Wait for overlay to be removed
        await page.waitForTimeout(2000);
        
        // Check if auth is removed
        const newBodyClasses = await page.evaluate(() => document.body.className);
        const newHasAuthRequired = newBodyClasses.includes('tlf-auth-required');
        console.log('After unlock - tlf-auth-required:', newHasAuthRequired);
        
        const newOverlay = await page.$('.tlf-auth-overlay');
        console.log('After unlock - overlay present:', !!newOverlay);
        
        // Check for news articles
        const articles = await page.$$('#news-feed-articles article');
        console.log('News articles count:', articles.length);
        
        if (articles.length > 0) {
          console.log('SUCCESS: Site unlocked and content visible!');
        } else {
          console.log('WARNING: Unlocked but no articles found');
        }
      } else {
        console.log('ERROR: Unlock button not found');
      }
    } else {
      console.log('ERROR: Password input not found');
    }
  } else {
    console.log('\n=== AUTH GATE INACTIVE ===');
    console.log('Either no secret.json or already authenticated');
    
    // Check content directly
    const articles = await page.$$('#news-feed-articles article');
    console.log('News articles count:', articles.length);
    
    if (articles.length > 0) {
      console.log('SUCCESS: Site accessible without auth');
    } else {
      console.log('WARNING: No articles found');
    }
  }
  
  console.log('\n=== CONSOLE ERRORS ===');
  if (consoleErrors.length > 0) {
    consoleErrors.forEach((err, i) => console.log(`${i+1}: ${err}`));
  } else {
    console.log('No console errors');
  }
  
  console.log('\n=== DONE ===');
  await browser.close();
})();