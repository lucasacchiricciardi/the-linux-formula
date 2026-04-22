import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    headless: false,  // Show browser for visual check
    executablePath: '/usr/bin/google-chrome'
  });
  
  const page = await browser.newPage();
  
  console.log('=== NAVIGATING ===');
  await page.goto('https://lucasacchiricciardi.github.io/the-linux-formula/', { waitUntil: 'load', timeout: 30000 });
  
  // Check overlay visibility
  const overlay = await page.$('.tlf-auth-overlay');
  if (overlay) {
    const isVisible = await overlay.isVisible();
    const box = await overlay.boundingBox();
    console.log('Overlay visible:', isVisible);
    console.log('Overlay box:', box);
  }
  
  const modal = await page.$('.tlf-auth-modal');
  if (modal) {
    const isVisible = await modal.isVisible();
    console.log('Modal visible:', isVisible);
  }
  
  // Check CSS
  const overlayCss = await page.evaluate(() => {
    const el = document.querySelector('.tlf-auth-overlay');
    if (!el) return null;
    const style = window.getComputedStyle(el);
    return {
      display: style.display,
      opacity: style.opacity,
      visibility: style.visibility,
      zIndex: style.zIndex,
      position: style.position
    };
  });
  console.log('Overlay CSS:', overlayCss);
  
  console.log('\n=== Take screenshot ===');
  await page.screenshot({ path: 'auth-screen.png', fullPage: true });
  console.log('Saved to auth-screen.png');
  
  await browser.close();
})();