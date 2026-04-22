#!/usr/bin/env node
/**
 * Debug script: Test password validation
 */

import { chromium } from 'playwright';

const SITE_URL = 'http://localhost:8080';

async function runDebug() {
  console.log('🔍 Debug: Password Validation\n');
  
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome'
  });

  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Capture ALL console messages
  page.on('console', msg => {
    console.log(`[${msg.type().toUpperCase()}]`, msg.text());
  });
  
  page.on('pageerror', err => {
    console.log('[PAGE ERROR]', err.message);
  });

  try {
    await page.goto(SITE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForSelector('#tlf-auth-overlay', { timeout: 10000 });
    console.log('\n--- Auth overlay loaded ---\n');
    
    // Check the hash
    const hash = await page.evaluate(async () => {
      try {
        const resp = await fetch('./secret.json');
        const data = await resp.json();
        return data.hash;
      } catch (e) {
        return 'Error: ' + e.message;
      }
    });
    console.log('Hash from secret.json:', hash);
    
    // Check if CryptoJS is loaded
    const cryptoJsLoaded = await page.evaluate(() => {
      return typeof CryptoJS !== 'undefined';
    });
    console.log('CryptoJS loaded:', cryptoJsLoaded);
    
    // Test the APR1 function
    const testResult = await page.evaluate(() => {
      try {
        // Get hash
        const hash = '$apr1$test1234$qP1HjF4w4n8912Of';
        
        // Check if verifyApr1Password is defined
        if (typeof window.verifyApr1Password === 'function') {
          return 'verifyApr1Password is global';
        }
        
        // Check if CryptoJS is available
        if (typeof CryptoJS === 'undefined') {
          return 'CryptoJS not loaded';
        }
        
        // Try to call the verification manually by getting the button and simulating
        const btn = document.querySelector('#tlf-auth-button');
        const input = document.querySelector('#tlf-auth-input');
        
        if (!btn || !input) {
          return 'Missing elements';
        }
        
        // Check button click handler
        return 'Elements exist, button click will test validation';
      } catch (e) {
        return 'Error: ' + e.message;
      }
    });
    console.log('Test result:', testResult);
    
    // Try filling and clicking
    console.log('\n--- Testing password entry ---\n');
    
    await page.fill('#tlf-auth-input', 'luca');
    console.log('Password filled: luca');
    
    // Click the button
    console.log('Clicking button...');
    await page.click('#tlf-auth-button');
    
    // Wait a moment
    await page.waitForTimeout(2000);
    
    // Check if overlay is still there
    const overlayStillExists = await page.$('#tlf-auth-overlay');
    console.log('\nOverlay still exists:', !!overlayStillExists);
    
    // Check for error message
    const errorVisible = await page.evaluate(() => {
      const errorEl = document.querySelector('#tlf-auth-error');
      return errorEl ? errorEl.classList.contains('show') : 'no error element';
    });
    console.log('Error message visible:', errorVisible);
    
    // Take screenshot
    await page.screenshot({ path: 'debug-validation.png' });
    console.log('\nScreenshot saved to debug-validation.png');
    
    await browser.close();
    
  } catch (error) {
    console.error('ERROR:', error.message);
    await browser.close();
  }
}

runDebug();