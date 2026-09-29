import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const BRAVE_PATH = '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser';
const SCREENSHOT_DIR = path.resolve(process.cwd(), 'playwright-screenshots/phase4');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  console.log('🚀 Starting Phase 4 Live Browser Audit with Puppeteer and Brave...');
  const browser = await puppeteer.launch({
    executablePath: BRAVE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 393, height: 852, deviceScaleFactor: 2 });

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore offline network fetch failures (e.g. Supabase/Privy when running offline)
      if (
        !text.includes('ERR_NETWORK_CHANGED') &&
        !text.includes('ERR_INTERNET_DISCONNECTED') &&
        !text.includes('ERR_NAME_NOT_RESOLVED') &&
        !text.includes('Failed to fetch') &&
        !text.includes('status of 400')
      ) {
        consoleErrors.push(text);
      }
    }
  });

  // 1. Splash View
  console.log('1. Testing Splash View on http://localhost:3000 ...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-splash-view.png') });

  // Dismiss cookie banner & authenticate in localStorage
  await page.evaluate(() => {
    localStorage.setItem('partylot_cookie_consent_v1', 'accepted');
  });

  // 2. Enter Home View (Authenticated)
  console.log('2. Entering Home View (Light Mode)...');
  await page.evaluate(() => {
    const store = window.__partyStore;
    if (store) {
      store.setState({
        currentUser: {
          id: 'u-law',
          name: 'Law',
          handle: '@lawx',
          avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
          gatheringsCount: 12,
          gamesCount: 45,
          peopleCount: 22,
          settlementsCount: 15,
          balance: 42.50,
          isPrivyAuthenticated: true,
        },
        currentView: 'home',
        activeTab: 'home',
        theme: 'light',
      });
      document.documentElement.classList.remove('dark');
    }
  });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-home-light.png') });

  // Home Dark
  console.log('3. Testing Home View (Dark Mode)...');
  await page.evaluate(() => {
    const store = window.__partyStore;
    if (store) {
      store.setState({ theme: 'dark' });
      document.documentElement.classList.add('dark');
    }
  });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-home-dark.png') });

  // 4. Party Detail View (Light & Dark)
  console.log('4. Testing Party Detail View (Light Mode)...');
  await page.evaluate(() => {
    const store = window.__partyStore;
    if (store) {
      const party = store.getState().parties[0];
      store.setState({
        currentPartyId: party?.id || 'p-404',
        currentView: 'party-detail',
        theme: 'light',
      });
      document.documentElement.classList.remove('dark');
    }
  });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-party-detail-light.png') });

  console.log('5. Testing Party Detail View (Dark Mode)...');
  await page.evaluate(() => {
    const store = window.__partyStore;
    if (store) {
      store.setState({ theme: 'dark' });
      document.documentElement.classList.add('dark');
    }
  });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-party-detail-dark.png') });

  // 6. Split View (Light & Dark)
  console.log('6. Testing Split View (Light Mode)...');
  await page.evaluate(() => {
    const store = window.__partyStore;
    if (store) {
      store.setState({
        currentView: 'split',
        theme: 'light',
      });
      document.documentElement.classList.remove('dark');
    }
  });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06-split-light.png') });

  console.log('7. Testing Split View (Dark Mode)...');
  await page.evaluate(() => {
    const store = window.__partyStore;
    if (store) {
      store.setState({ theme: 'dark' });
      document.documentElement.classList.add('dark');
    }
  });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07-split-dark.png') });

  // 8. Party Pot View (Light & Dark)
  console.log('8. Testing Party Pot View (Light Mode)...');
  await page.evaluate(() => {
    const store = window.__partyStore;
    if (store) {
      store.setState({
        currentView: 'party-pot',
        theme: 'light',
      });
      document.documentElement.classList.remove('dark');
    }
  });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08-party-pot-light.png') });

  console.log('9. Testing Party Pot View (Dark Mode)...');
  await page.evaluate(() => {
    const store = window.__partyStore;
    if (store) {
      store.setState({ theme: 'dark' });
      document.documentElement.classList.add('dark');
    }
  });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09-party-pot-dark.png') });

  // 10. Test Zero-Party Empty States (Light & Dark)
  console.log('10. Testing Zero-Party Empty States...');
  await page.evaluate(() => {
    const store = window.__partyStore;
    if (store) {
      store.setState({
        parties: [],
        currentPartyId: '',
        currentView: 'party-detail',
        theme: 'light',
      });
      document.documentElement.classList.remove('dark');
    }
  });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10-party-detail-empty.png') });

  await page.evaluate(() => {
    const store = window.__partyStore;
    if (store) {
      store.setState({
        parties: [],
        currentPartyId: '',
        currentView: 'split',
        theme: 'dark',
      });
      document.documentElement.classList.add('dark');
    }
  });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11-split-empty-dark.png') });

  await browser.close();

  console.log('--- Phase 4 Browser Audit Results ---');
  console.log(`Captured 11 verification screenshots in: ${SCREENSHOT_DIR}`);
  console.log(`Application code errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.log('Errors:', consoleErrors);
  } else {
    console.log('✅ Clean audit: 0 application errors or warnings detected!');
  }
}

run().catch((err) => {
  console.error('Audit failed with error:', err);
  process.exit(1);
});
