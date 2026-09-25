import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve(process.cwd(), 'playwright-screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  console.log('🔍 Starting Responsive, Aesthetic & Legibility Audit with Playwright...');
  const browser = await chromium.launch({ headless: true });

  const viewports = [
    { name: 'mobile-iphone14', width: 393, height: 852 },
    { name: 'mobile-compact', width: 375, height: 667 },
    { name: 'tablet-ipad', width: 768, height: 1024 },
  ];

  for (const vp of viewports) {
    console.log(`\n📱 Testing Viewport: ${vp.name} (${vp.width}x${vp.height})...`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      colorScheme: 'light',
    });

    const page = await context.newPage();
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);

    // 1. Splash View with Glass Language Selector
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `audit-${vp.name}-01-splash.png`), fullPage: false });

    // 2. Authenticate as Law & Go to Profile
    await page.evaluate(() => {
      const store = window.__partyStore;
      if (store) {
        store.setState({
          currentUser: {
            id: 'u-law',
            name: 'Law',
            handle: '@lawx',
            avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
            coverImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1200&q=80',
            gatheringsCount: 24,
            gamesCount: 142,
            peopleCount: 38,
            settlementsCount: 71,
            balance: 48.50,
            bio: 'Good food, better people.',
            location: 'Medellin, Colombia',
            website: 'partylot.xyz/lawx',
            instagram: 'lawx',
            twitter: 'lawx',
            isPrivyAuthenticated: true,
          },
          currentView: 'home',
          activeTab: 'profile',
          theme: 'light',
        });
        document.documentElement.classList.remove('dark');
      }
    });
    await page.waitForTimeout(800);

    // Profile View
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `audit-${vp.name}-02-profile.png`), fullPage: false });

    // Open Settings Modal to audit Language Switch Legibility
    const settingsBtn = await page.waitForSelector('button[aria-label="Settings"]', { timeout: 3000 });
    if (settingsBtn) {
      await settingsBtn.click();
      await page.waitForTimeout(600);

      // Audit Language Switch Computed Colors
      const langStyle = await page.evaluate(() => {
        const langEl = document.querySelector('[aria-label="Language Selector"]');
        const activeBtn = langEl?.querySelector('button:has([class*="bg-[#F0DC00]"]), button.font-black, button:has(div)');
        const inactiveBtn = langEl?.querySelectorAll('button')[0] === activeBtn ? langEl?.querySelectorAll('button')[1] : langEl?.querySelectorAll('button')[0];
        
        return {
          containerBg: langEl ? window.getComputedStyle(langEl).backgroundColor : 'not found',
          activeText: activeBtn ? window.getComputedStyle(activeBtn).color : 'not found',
          activeBg: activeBtn ? window.getComputedStyle(activeBtn).backgroundColor : 'not found',
          inactiveText: inactiveBtn ? window.getComputedStyle(inactiveBtn).color : 'not found',
        };
      });
      console.log(`Language Switch Legibility in Settings (${vp.name}):`, langStyle);

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `audit-${vp.name}-03-settings-light.png`), fullPage: false });

      // Click language toggle to switch between ES and EN
      const langBtns = await page.$$('[aria-label="Language Selector"] button');
      if (langBtns.length >= 2) {
        console.log('Toggling language...');
        await langBtns[0].click(); // click ES
        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, `audit-${vp.name}-04-settings-lang-switched.png`), fullPage: false });
      }

      // Close settings modal
      const closeSettingsBtn = await page.$('button[aria-label="Cerrar ajustes"]');
      if (closeSettingsBtn) {
        await closeSettingsBtn.click();
        await page.waitForTimeout(500);
      }
    }

    // Go to Home View
    await page.evaluate(() => {
      window.__partyStore.setState({ activeTab: 'home' });
    });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `audit-${vp.name}-05-home.png`), fullPage: false });

    await context.close();
  }

  await browser.close();
  console.log('\n🎉 Comprehensive Responsive & Aesthetic Audit Finished Successfully!');
}

run().catch((err) => {
  console.error('❌ Audit script failed:', err);
  process.exit(1);
});
