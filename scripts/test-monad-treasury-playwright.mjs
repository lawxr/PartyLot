import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function runMonadTreasuryTest() {
  console.log('⚡ Starting Monad Treasury & USDC Visual Verification...');
  const screenshotsDir = path.join(process.cwd(), 'playwright-screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 393, height: 852 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  const page = await context.newPage();

  console.log('1. Navigating to http://localhost:3000 ...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Authenticate user and switch to party-pot
  console.log('2. Setting user state and navigating to party-pot...');
  await page.evaluate(() => {
    const store = window.__partyStore;
    if (store) {
      store.setState({
        currentUser: {
          id: 'u-law',
          name: 'Law',
          handle: '@lawx',
          avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
          gatheringsCount: 24,
          gamesCount: 142,
          peopleCount: 8,
          settlementsCount: 38,
          balance: 140.0,
          isPrivyAuthenticated: true,
          walletAddress: '0x1d997eba6837b93fad843164844e7ed2a4dbcba34492f6d2b28c58467cc8016b',
        },
        currentPartyId: 'p-404',
        currentView: 'party-pot',
        activeTab: 'home',
        theme: 'light',
        language: 'es',
      });
      document.documentElement.classList.remove('dark');
    }
  });
  await page.waitForTimeout(1200);

  console.log('📸 Capturing Party Pot with USDC & Monad banner...');
  await page.screenshot({
    path: path.join(screenshotsDir, 'monad-treasury-party-pot.png'),
    fullPage: false,
  });

  // Tap "Aportar USDC" to test the deposit modal
  console.log('📱 Opening Add USDC Modal...');
  const addBtn = page.getByRole('button', { name: /Aportar/i }).first();
  if (await addBtn.isVisible()) {
    await addBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({
      path: path.join(screenshotsDir, 'monad-treasury-add-sheet.png'),
      fullPage: false,
    });
  }

  // Switch to Split View
  console.log('📱 Switching to Split View...');
  await page.evaluate(() => {
    const store = window.__partyStore;
    if (store) {
      store.setState({
        currentView: 'split',
      });
    }
  });
  await page.waitForTimeout(1000);

  console.log('📸 Capturing Split View with USDC Total Spent...');
  await page.screenshot({
    path: path.join(screenshotsDir, 'monad-treasury-split.png'),
    fullPage: false,
  });

  // Switch to PartyDetailView
  console.log('📱 Switching to PartyDetailView...');
  await page.evaluate(() => {
    const store = window.__partyStore;
    if (store) {
      store.setState({
        currentView: 'party-detail',
      });
    }
  });
  await page.waitForTimeout(1000);

  console.log('📸 Capturing PartyDetailView with USDC Pot badge...');
  await page.screenshot({
    path: path.join(screenshotsDir, 'monad-treasury-party-detail.png'),
    fullPage: false,
  });

  await browser.close();
  console.log('🎉 Monad Treasury & USDC verification completed successfully!');
}

runMonadTreasuryTest().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
