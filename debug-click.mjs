import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    headless: false,  // Show browser to see what's happening
    executablePath: '/usr/bin/google-chrome'
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Collect console
  page.on('console', msg => {
    console.log(`[CONSOLE ${msg.type()}]`, msg.text());
  });
  
  page.on('pageerror', err => {
    console.log('[PAGE ERROR]', err.message);
  });
  
  console.log('=== NAVIGATING ===');
  await page.goto('https://lucasacchiricciardi.github.io/the-linux-formula/', { waitUntil: 'load', timeout: 30000 });
  
  // Wait for auth to load
  await page.waitForTimeout(3000);
  
  console.log('\n=== CHECKING ELEMENTS ===');
  
  // Check if elements exist
  const input = await page.$('#tlf-auth-input');
  const button = await page.$('#tlf-auth-button');
  const overlay = await page.$('.tlf-auth-overlay');
  
  console.log('Input exists:', !!input);
  console.log('Button exists:', !!button);
  console.log('Overlay exists:', !!overlay);
  
  if (input) {
    const inputValue = await page.evaluate(() => {
      const el = document.querySelector('#tlf-auth-input');
      return el ? el.outerHTML : null;
    });
    console.log('Input HTML:', inputValue);
  }
  
  if (button) {
    const buttonValue = await page.evaluate(() => {
      const el = document.querySelector('#tlf-auth-button');
      return el ? el.outerHTML : null;
    });
    console.log('Button HTML:', buttonValue);
    
    // Check if button is visible and enabled
    const isVisible = await button.isVisible();
    const isEnabled = await button.isEnabled();
    console.log('Button visible:', isVisible);
    console.log('Button enabled:', isEnabled);
    
    // Get button text
    const buttonText = await button.textContent();
    console.log('Button text:', buttonText);
  }
  
  // Try to fill and click
  if (input && button) {
    console.log('\n=== ATTEMPTING INTERACTION ===');
    await input.fill('luca');
    console.log('Filled password');
    
    // Try different click approaches
    try {
      console.log('Trying normal click...');
      await button.click();
      console.log('Normal click succeeded');
    } catch (e) {
      console.log('Normal click failed:', e.message);
      
      try {
        console.log('Trying force click...');
        await button.click({ force: true });
        console.log('Force click succeeded');
      } catch (e2) {
        console.log('Force click failed:', e2.message);
        
        try {
          console.log('Trying dispatch click event...');
          await page.evaluate(() => {
            const btn = document.querySelector('#tlf-auth-button');
            if (btn) {
              btn.dispatchEvent(new MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true
              }));
            }
          });
          console.log('Dispatch click succeeded');
        } catch (e3) {
          console.log('Dispatch click failed:', e3.message);
        }
      }
    }
    
    // Wait a bit to see what happens
    await page.waitForTimeout(3000);
    
    // Check if auth removed
    const stillHasAuth = await page.evaluate(() => 
      document.body.classList.contains('tlf-auth-required')
    );
    console.log('Still has auth-required class:', stillHasAuth);
    
    const articles = await page.$$('#news-feed-articles article');
    console.log('Articles count:', articles.length);
  }
  
  console.log('\n=== Taking screenshot ===');
  await page.screenshot({ path: 'debug-login.png', fullPage: true });
  console.log('Screenshot saved to debug-login.png');
  
  await browser.close();
})();