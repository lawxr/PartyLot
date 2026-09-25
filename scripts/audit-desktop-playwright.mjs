import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function captureDesktopViews() {
  const screenshotsDir = path.join(process.cwd(), 'playwright-screenshots', 'desktop-audit');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();

  // 1. Splash View
  console.log('Navigating to Splash on desktop...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(screenshotsDir, '01-desktop-splash.png') });

  // Authenticate user
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
          isPrivyAuthenticated: true,
        },
        currentPartyId: 'p-404',
        currentView: 'home',
        activeTab: 'home',
        theme: 'light',
        language: 'es',
      });
    }
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(screenshotsDir, '02-desktop-home.png') });

  // Party Detail
  await page.evaluate(() => {
    window.__partyStore?.setState({ currentView: 'party-detail' });
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(screenshotsDir, '03-desktop-party-detail.png') });

  // Party Pot
  await page.evaluate(() => {
    window.__partyStore?.setState({ currentView: 'party-pot' });
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(screenshotsDir, '04-desktop-party-pot.png') });

  // Split
  await page.evaluate(() => {
    window.__partyStore?.setState({ currentView: 'split' });
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(screenshotsDir, '05-desktop-split.png') });

  // Profile
  await page.evaluate(() => {
    window.__partyStore?.setState({ currentView: 'profile', activeTab: 'profile' });
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(screenshotsDir, '06-desktop-profile.png') });

  await browser.close();
  console.log('Desktop audit screenshots captured!');
}

captureDesktopViews().catch(console.error);
