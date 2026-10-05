import puppeteer from 'puppeteer-core';
import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const BRAVE_PATH = '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser';
const PORT = 3333;
const BASE_URL = `http://localhost:${PORT}`;
const SCREENSHOT_DIR = path.resolve(process.cwd(), 'playwright-screenshots/e2e');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}`, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 500);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForServer(port, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    const ready = await checkPort(port);
    if (ready) return true;
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

let serverProcess = null;

async function startServerIfNeeded() {
  const isRunning = await checkPort(PORT);
  if (isRunning) {
    console.log(`📡 Reusing existing server on port ${PORT}...`);
    return;
  }

  console.log(`🚀 Starting production Next.js server on port ${PORT}...`);
  serverProcess = spawn('npx', ['next', 'start', '-p', String(PORT)], {
    stdio: 'inherit',
    env: { ...process.env, PORT: String(PORT) },
  });

  const ready = await waitForServer(PORT);
  if (!ready) {
    throw new Error(`Server failed to start on port ${PORT} within timeout.`);
  }
  console.log(`✅ Server is online at ${BASE_URL}`);
}

function stopServer() {
  if (serverProcess) {
    console.log('🛑 Stopping Next.js test server...');
    serverProcess.kill('SIGTERM');
    serverProcess = null;
  }
}

async function runE2E() {
  console.log('\n======================================================');
  console.log('🧪 PARTYLOT END-TO-END (E2E) TEST SUITE');
  console.log('======================================================\n');

  await startServerIfNeeded();

  const browser = await puppeteer.launch({
    executablePath: BRAVE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 393, height: 852, deviceScaleFactor: 2 });

  const passedTests = [];
  const failedTests = [];

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passedTests.push(testName);
    } else {
      console.error(`  ❌ FAIL: ${testName} ${details ? `(${details})` : ''}`);
      failedTests.push({ testName, details });
    }
  }

  try {
    // -------------------------------------------------------------
    // TEST 1: Splash View & Cookie Consent Banner
    // -------------------------------------------------------------
    console.log('📋 Test 1: Splash View & Cookie Consent');
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });

    const title = await page.title();
    assert(title.includes('PARTYLOT'), 'Page title contains PARTYLOT', `Got: ${title}`);

    // Verify wordmark on splash
    const hasWordmark = await page.evaluate(() => {
      const heading = document.querySelector('h1');
      return heading && heading.textContent.includes('PartyLot');
    });
    assert(hasWordmark, 'Splash renders PartyLot wordmark');

    // Dismiss cookie banner
    await page.evaluate(() => {
      const bannerButton = document.querySelector('button[aria-label="Aceptar cookies"]') ||
        document.querySelector('button[aria-label="Accept cookies"]') ||
        Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('Entendido') || b.textContent.includes('Aceptar'));
      if (bannerButton) bannerButton.click();
      localStorage.setItem('partylot_cookie_consent_v1', 'accepted');
    });
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-splash-view.png') });

    // -------------------------------------------------------------
    // TEST 2: Join Party Navigation & Invite Code Input
    // -------------------------------------------------------------
    console.log('\n📋 Test 2: Join Party View & Code Input');
    const joinButtonExists = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find((b) => b.textContent.includes('código') || b.textContent.includes('invite') || b.textContent.includes('Tengo'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    assert(joinButtonExists, 'Click "Tengo código de invitación" button on splash');
    await new Promise((r) => setTimeout(r, 600));

    const isJoinView = await page.evaluate(() => {
      const store = window.__partyStore?.getState();
      return store?.currentView === 'join-party';
    });
    assert(isJoinView, 'Router transitions to join-party view');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-join-party-view.png') });

    // -------------------------------------------------------------
    // TEST 3: Enter Authenticated Home Dashboard
    // -------------------------------------------------------------
    console.log('\n📋 Test 3: Authenticated Home Dashboard');
    await page.evaluate(() => {
      const store = window.__partyStore;
      if (store) {
        store.setState({
          currentUser: {
            id: 'u-e2e-user',
            name: 'Alex E2E',
            handle: '@alexe2e',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
            gatheringsCount: 0,
            gamesCount: 0,
            peopleCount: 0,
            settlementsCount: 0,
            balance: 0,
            isPrivyAuthenticated: true,
          },
          currentView: 'home',
          activeTab: 'home',
          theme: 'light',
        });
      }
    });
    await new Promise((r) => setTimeout(r, 600));

    const hasPartyCard = await page.evaluate(() => {
      const text = document.body.textContent;
      return text.includes('404 House') || text.includes('House') || text.includes('Fiesta') || text.includes('Party');
    });
    assert(hasPartyCard, 'Home dashboard displays parties stream');

    // Test Theme Toggle
    await page.evaluate(() => {
      const store = window.__partyStore;
      store?.getState().toggleTheme();
    });
    await new Promise((r) => setTimeout(r, 300));
    const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    assert(isDark, 'Theme toggles to Dark Mode');

    await page.evaluate(() => {
      const store = window.__partyStore;
      store?.getState().toggleTheme();
    });
    await new Promise((r) => setTimeout(r, 300));
    const isLight = await page.evaluate(() => !document.documentElement.classList.contains('dark'));
    assert(isLight, 'Theme toggles back to Light Mode');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-home-dashboard.png') });

    // -------------------------------------------------------------
    // TEST 4: Party Detail View & Treasury Summary
    // -------------------------------------------------------------
    console.log('\n📋 Test 4: Party Detail View & Pot');
    await page.evaluate(() => {
      const store = window.__partyStore;
      const state = store?.getState();
      const firstParty = state?.parties?.[0];
      if (firstParty) {
        store.setState({
          currentPartyId: firstParty.id,
          currentView: 'party-detail',
        });
      }
    });
    await new Promise((r) => setTimeout(r, 600));

    const partyDetailLoaded = await page.evaluate(() => {
      const store = window.__partyStore?.getState();
      const party = store?.parties.find((p) => p.id === store.currentPartyId);
      const text = document.body.textContent;
      return party && text.includes(party.title);
    });
    assert(partyDetailLoaded, 'Party Detail view loads active party title');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-party-detail.png') });

    // -------------------------------------------------------------
    // TEST 5: Minigames & Real Social Voting
    // -------------------------------------------------------------
    console.log('\n📋 Test 5: Minigames & Real Voting Interaction');
    await page.evaluate(() => {
      const store = window.__partyStore;
      store?.setState({
        currentView: 'games',
        activeTab: 'games',
        activeGameId: 'whos-most-likely',
      });
    });
    await new Promise((r) => setTimeout(r, 600));

    // Submit a real vote in Who's Most Likely
    const voteCast = await page.evaluate(() => {
      const store = window.__partyStore;
      if (!store) return false;
      const state = store.getState();
      const firstQ = state.whosMostLikely?.[0];
      if (!firstQ) return false;
      const currentUserId = state.currentUser?.id || 'u-e2e-user';
      store.getState().voteWhosMostLikely(firstQ.id, currentUserId);
      return true;
    });
    assert(voteCast, 'Cast vote in "Who is Most Likely" minigame');

    const voteRecordedInStore = await page.evaluate(() => {
      const store = window.__partyStore?.getState();
      const firstQ = store?.whosMostLikely?.[0];
      const votes = firstQ?.votes || {};
      const currentUserId = store?.currentUser?.id;
      return Boolean(votes[currentUserId] && votes[currentUserId] > 0);
    });
    assert(voteRecordedInStore, 'Minigame vote recorded in user voting state');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-minigames-voted.png') });

    // -------------------------------------------------------------
    // TEST 6: Profile View with 100% Real Metrics
    // -------------------------------------------------------------
    console.log('\n📋 Test 6: Profile View Metrics Verification (100% Real)');
    await page.evaluate(() => {
      const store = window.__partyStore;
      store?.setState({
        currentView: 'profile',
        activeTab: 'profile',
      });
    });
    await new Promise((r) => setTimeout(r, 600));

    // Verify profile does NOT display fake 142 games or fake bio
    const profileStats = await page.evaluate(() => {
      const store = window.__partyStore?.getState();
      const renderedText = document.body.innerText || '';
      const hasFake142 = /142\s*(juegos|games|partidas)/i.test(renderedText);
      const hasFakeBio = renderedText.includes('Good food, better people.');
      const userHandle = store?.currentUser?.handle || '';
      const displaysRealHandle = renderedText.includes(userHandle);

      return {
        hasFake142,
        hasFakeBio,
        displaysRealHandle,
      };
    });

    assert(!profileStats.hasFake142, 'Profile does NOT display fake 142 games');
    assert(!profileStats.hasFakeBio, 'Profile does NOT display fake default bio');
    assert(profileStats.displaysRealHandle, 'Profile displays actual authenticated handle');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06-profile-real-metrics.png') });

  } catch (err) {
    console.error('💥 E2E Test execution exception:', err);
    failedTests.push({ testName: 'Runtime Exception', details: err.message });
  } finally {
    await browser.close();
    stopServer();
  }

  console.log('\n======================================================');
  console.log(`📊 E2E SUMMARY: ${passedTests.length} PASSED, ${failedTests.length} FAILED`);
  console.log('======================================================\n');

  if (failedTests.length > 0) {
    console.error('❌ E2E Tests Failed:');
    failedTests.forEach((f) => console.error(`  - ${f.testName}: ${f.details}`));
    process.exit(1);
  } else {
    console.log('🎉 ALL END-TO-END TEST SUITES PASSED SUCCESSFULLY!\n');
    process.exit(0);
  }
}

runE2E();
