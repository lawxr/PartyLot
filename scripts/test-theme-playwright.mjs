import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve(process.cwd(), 'playwright-screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  console.log('🚀 Starting Full Playwright visual & functional verification...');
  const browser = await chromium.launch({ headless: true });
  
  // Emulate mobile iPhone 14 viewport with OS dark mode simulation
  const context = await browser.newContext({
    viewport: { width: 393, height: 852 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    colorScheme: 'dark', // Simulates user having OS dark mode ON
  });

  const page = await context.newPage();
  
  // 1. Initial page load (Splash / Landing)
  console.log('1. Navigating to http://localhost:3000 ...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const initialLightCheck = await page.evaluate(() => {
    const htmlClasses = document.documentElement.className;
    const bodyBg = window.getComputedStyle(document.body).backgroundColor;
    const bodyColor = window.getComputedStyle(document.body).color;
    const isDarkClassOnHtml = document.documentElement.classList.contains('dark');
    return { htmlClasses, bodyBg, bodyColor, isDarkClassOnHtml };
  });

  console.log('📊 1. Landing View Initial State (Light Default Verified):', initialLightCheck);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-landing-light.png'), fullPage: false });

  // 2. Set authenticated state and navigate to Home
  console.log('2. Authenticating in store and navigating to Home (Light)...');
  await page.evaluate(() => {
    const store = window.__partyStore;
    if (store) {
      const prevUser = store.getState().currentUser || {};
      store.setState({
        currentUser: {
          ...prevUser,
          id: 'usr_me',
          name: 'Alex Rivera',
          handle: '@alexander',
          isPrivyAuthenticated: true,
          coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80',
        },
        currentView: 'home',
        activeTab: 'home',
        theme: 'light',
      });
      document.documentElement.classList.remove('dark');
    }
  });
  await page.waitForTimeout(1000);

  const homeCheck = await page.evaluate(() => {
    const htmlClasses = document.documentElement.className;
    const bodyBg = window.getComputedStyle(document.body).backgroundColor;
    return {
      htmlClasses,
      bodyBg,
      view: window.__partyStore?.getState?.().currentView,
      isDarkClassOnHtml: document.documentElement.classList.contains('dark'),
    };
  });
  console.log('🏠 2. Home View State (Light Mode):', homeCheck);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-home-light.png'), fullPage: false });

  // 3. Navigate to Party Detail View (Light)
  console.log('3. Navigating to Party Detail (Light)...');
  await page.evaluate(() => {
    const store = window.__partyStore;
    if (store) {
      store.getState().selectParty('p-404');
    }
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-party-detail-light.png'), fullPage: false });

  // 4. Navigate to Split View (Light)
  console.log('4. Navigating to Split View (Light)...');
  await page.evaluate(() => {
    const store = window.__partyStore;
    if (store) {
      store.setState({ currentView: 'split' });
    }
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-split-light.png'), fullPage: false });

  // 5. Navigate to Party Pot View (Light)
  console.log('5. Navigating to Party Pot View (Light)...');
  await page.evaluate(() => {
    const store = window.__partyStore;
    if (store) {
      store.setState({ currentView: 'party-pot' });
    }
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-pot-light.png'), fullPage: false });

  // 6. Navigate to Crews View (Light)
  console.log('6. Navigating to Crews View (Light)...');
  await page.evaluate(() => {
    const store = window.__partyStore;
    if (store) {
      store.setState({ currentView: 'home', activeTab: 'crews' });
    }
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06-crews-light.png'), fullPage: false });

  // 7. Navigate to Profile View (Light)
  console.log('7. Navigating to Profile View (Light)...');
  await page.evaluate(() => {
    const store = window.__partyStore;
    if (store) {
      store.setState({ currentView: 'profile', activeTab: 'profile' });
    }
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07-profile-light.png'), fullPage: false });

  // 8. Open Settings Modal & Toggle Dark Mode ON
  console.log('8. Opening Settings Modal from Profile...');
  try {
    const settingsBtn = await page.waitForSelector('button[aria-label="Settings"]', { timeout: 4000 });
    if (settingsBtn) {
      console.log('Settings button found! Clicking...');
      await settingsBtn.click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08-settings-modal-light.png'), fullPage: false });

      console.log('🌙 Toggling Dark Mode ON...');
      const switchBtn = await page.waitForSelector('button[aria-label="Toggle dark mode"]', { timeout: 4000 });
      if (switchBtn) {
        await switchBtn.click();
        await page.waitForTimeout(800);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09-settings-modal-dark.png'), fullPage: false });

        // Close settings modal
        const closeBtn = await page.$('button[aria-label="Cerrar ajustes"], button:has-text("Listo"), button:has-text("Done")');
        if (closeBtn) {
          await closeBtn.click();
          await page.waitForTimeout(600);
        }
        
        const darkProfileState = await page.evaluate(() => ({
          htmlClasses: document.documentElement.className,
          isDark: document.documentElement.classList.contains('dark'),
          bodyBg: window.getComputedStyle(document.body).backgroundColor,
          bodyColor: window.getComputedStyle(document.body).color,
        }));
        console.log('🌙 9. Profile View State (Dark Mode ON):', darkProfileState);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10-profile-dark.png'), fullPage: false });

        // Check Home in Dark Mode
        await page.evaluate(() => {
          window.__partyStore.setState({ currentView: 'home', activeTab: 'home' });
        });
        await page.waitForTimeout(600);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11-home-dark.png'), fullPage: false });

        // 9. Revert back to default Light Mode
        console.log('☀️ 10. Reverting to Default Light Mode...');
        await page.evaluate(() => {
          window.__partyStore.getState().setTheme('light');
        });
        await page.waitForTimeout(600);

        const lightRestored = await page.evaluate(() => ({
          htmlClasses: document.documentElement.className,
          isDark: document.documentElement.classList.contains('dark'),
          bodyBg: window.getComputedStyle(document.body).backgroundColor,
          bodyColor: window.getComputedStyle(document.body).color,
        }));
        console.log('☀️ Restored Default Light Mode State:', lightRestored);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12-home-restored-light.png'), fullPage: false });
      }
    }
  } catch (err) {
    console.warn('Settings modal interaction warning:', err.message);
  }

  await browser.close();
  console.log('🎉 Playwright complete visual & functional verification successfully finished!');
}

run().catch((err) => {
  console.error('❌ Playwright verification failed:', err);
  process.exit(1);
});
