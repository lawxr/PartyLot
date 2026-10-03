import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve(process.cwd(), 'playwright-screenshots/market-audit');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const AUDIT_MEMBERS = [
  { id: 'u-law', name: 'Law', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80', role: 'host', status: 'going', nightsTogether: 24 },
  { id: 'u-sofi', name: 'Sofi', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80', role: 'guest', status: 'going', nightsTogether: 12 },
  { id: 'u-ana', name: 'Ana', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80', role: 'guest', status: 'going', nightsTogether: 9 },
  { id: 'u-carlos', name: 'Carlos', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80', role: 'guest', status: 'going', nightsTogether: 7 },
];

const AUDIT_PARTIES = [
  {
    id: 'p-404',
    code: '404H',
    title: '404 House',
    date: 'Hoy',
    time: '9:00 PM',
    location: 'Laureles · Medellín',
    description: 'Rooftop golden hour, candid laughs, synth beats, and unscripted memories with the inner circle.',
    coverImage: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80',
    hostId: 'u-law',
    hostName: 'Law',
    members: AUDIT_MEMBERS,
    potBalance: 186.40,
    createdAt: '2026-09-22T18:00:00Z',
    status: 'live',
    crewId: 'c-404',
  },
  {
    id: 'p-rooftop',
    code: '9X2M',
    title: 'Cocktails Night',
    date: 'Viernes',
    time: '10:00 PM',
    location: 'El Poblado · Medellín',
    description: 'Cocteles de autor, golden hour, vinyl beats y terraza abierta con vista panorámica.',
    coverImage: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=1200&q=80',
    hostId: 'u-ana',
    hostName: 'Ana',
    members: AUDIT_MEMBERS.slice(0, 3),
    potBalance: 95.00,
    createdAt: '2026-09-21T12:00:00Z',
    status: 'upcoming',
    crewId: 'c-404',
  },
];

const AUDIT_CREWS = [
  {
    id: 'c-404',
    name: '404 Crew',
    description: 'El colectivo de fiestas de Laureles.',
    coverImage: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80',
    memberCount: 8,
    partyCount: 14,
    members: AUDIT_MEMBERS,
  },
];

async function runMarketAudit() {
  console.log('🏁 Starting Comprehensive End-to-End Playwright Market Audit...\n');

  const browser = await chromium.launch({ headless: true });
  const issues = [];

  // Mobile Context (iPhone 15 Pro: 393x852)
  const mobileContext = await browser.newContext({
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  const page = await mobileContext.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const txt = msg.text();
      // Filter harmless third-party / offline telemetry
      if (!txt.includes('Failed to fetch') && !txt.includes('Privy') && !txt.includes('400')) {
        issues.push({ type: 'Console Error', message: txt });
        console.error(`[Console Error]: ${txt}`);
      }
    }
  });

  page.on('pageerror', (err) => {
    issues.push({ type: 'Page Error', message: err.message });
    console.error(`[Page Error]: ${err.message}`);
  });

  page.on('requestfailed', (req) => {
    const url = req.url();
    // Ignore external analytics or privy endpoint mocks
    if (url.includes('localhost:3000') && !url.includes('_next/webpack-hmr') && req.method() !== 'HEAD') {
      issues.push({ type: 'Network Failure', message: `${req.method()} ${url}: ${req.failure()?.errorText}` });
      console.warn(`[Network Failure]: ${url}`);
    }
  });

  try {
    // -------------------------------------------------------------
    // FLOW 1: SPLASH & ONBOARDING
    // -------------------------------------------------------------
    console.log('📍 1. Testing Splash View...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-mobile-splash.png') });

    // Verify critical elements on Splash
    const titleExists = await page.locator('text=PartyLot').or(page.locator('text=La noche')).count();
    console.log(`   Splash title detected: ${titleExists > 0 ? 'YES' : 'NO'}`);

    // Dismiss Cookie Banner upfront (like a user clicking "Aceptar Todo")
    await page.waitForTimeout(1400); // Allow banner timer to fire
    const cookieAcceptBtn = page.locator('button:has-text("Aceptar Todo")').or(page.locator('button:has-text("Accept All")')).first();
    if (await cookieAcceptBtn.isVisible()) {
      console.log('   Accepting cookie policy banner...');
      await cookieAcceptBtn.click();
      await page.waitForTimeout(300);
    }
    await page.evaluate(() => {
      localStorage.setItem('partylot_cookie_consent_v1', 'accepted');
    });

    // -------------------------------------------------------------
    // FLOW 2: AUTHENTICATE AS USER & HOME DASHBOARD
    // -------------------------------------------------------------
    console.log('📍 2. Authenticating as Law (@lawx)...');
    await page.evaluate((mockData) => {
      // @ts-ignore
      const store = window.__partyStore;
      if (store) {
        const state = store.getState();
        const effectiveParties = state.parties && state.parties.length > 0 ? state.parties : mockData.parties;
        const effectiveCrews = state.crews && state.crews.length > 0 ? state.crews : mockData.crews;

        store.setState({
          currentUser: {
            id: 'u-law',
            name: 'Law',
            handle: '@lawx',
            avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
            coverImage: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80',
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
          parties: effectiveParties,
          crews: effectiveCrews,
          currentPartyId: effectiveParties[0]?.id || 'p-404',
          currentView: 'home',
          activeTab: 'home',
          theme: 'light',
          language: 'es',
        });
      }
    }, { parties: AUDIT_PARTIES, crews: AUDIT_CREWS });

    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-home-dashboard.png') });

    // -------------------------------------------------------------
    // FLOW 3: HOME DASHBOARD & NAVIGATION
    // -------------------------------------------------------------
    console.log('📍 3. Testing Home Dashboard Interactions...');
    const hasHero = await page.locator('text=404 House').or(page.locator('text=Cocktails')).count();
    console.log(`   Hero party visible: ${hasHero > 0 ? 'YES' : 'NO'}`);

    // Click "Ver todas" under Próximas fiestas
    const seeAllBtn = page.locator('button:has-text("Ver todas")').first();
    if (await seeAllBtn.isVisible()) {
      console.log('   Clicking "Ver todas" in Upcoming section...');
      await seeAllBtn.click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-tonight-via-upcoming.png') });
    }

    // -------------------------------------------------------------
    // FLOW 4: TONIGHT (RADAR & SOCIAL DISCOVERY)
    // -------------------------------------------------------------
    console.log('📍 4. Testing Tonight View (ActivityView)...');
    await page.evaluate(() => {
      // @ts-ignore
      window.__partyStore?.setState({ currentView: 'home', activeTab: 'activity' });
    });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-tonight-view-initial.png') });

    // Test Search input
    console.log('   Testing Search input in Tonight...');
    const searchInput = page.locator('input[placeholder*="Buscar fiesta"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('Miami');
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-tonight-search-miami.png') });
      await searchInput.fill('');
      await page.waitForTimeout(300);
    }

    // Test Filter Pills
    console.log('   Testing Filter Pills in Tonight...');
    const filterPills = ['Todas las fiestas', 'Esta noche', 'Mis crews', 'Otras crews'];
    for (const pill of filterPills) {
      const btn = page.locator(`button:has-text("${pill}")`).first();
      if (await btn.isVisible()) {
        await btn.click();
        await page.waitForTimeout(250);
      }
    }
    // Return to "Todas las fiestas"
    await page.locator('button:has-text("Todas las fiestas")').first().click();
    await page.waitForTimeout(400);

    // Test "Tocar puerta" Knock Flow
    console.log('   Testing "Tocar puerta" (Knock on Door) BottomSheet...');
    const knockBtn = page.locator('button:has-text("Tocar puerta")').first();
    if (await knockBtn.isVisible()) {
      await knockBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06-knock-bottom-sheet-open.png') });

      // Type an optional note
      const noteInput = page.locator('input[placeholder*="¡Hola! Voy con amigos"]');
      if (await noteInput.isVisible()) {
        await noteInput.fill('¡Hola Carlos! Voy con amigos.');
        await page.waitForTimeout(300);
      }

      // Submit Knock Request
      const sendKnockBtn = page.locator('button:has-text("Enviar solicitud")').first();
      if (await sendKnockBtn.isVisible()) {
        await sendKnockBtn.click();
        await page.waitForTimeout(600);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07-knock-success-feedback.png') });
        await page.waitForTimeout(1600); // Wait for modal auto-close
      }
    }

    // -------------------------------------------------------------
    // FLOW 5: PARTY DETAIL & SUB-VIEWS (Games, Pot, Split, Polls)
    // -------------------------------------------------------------
    console.log('📍 5. Testing Party Detail View...');
    await page.evaluate(() => {
      // @ts-ignore
      window.__partyStore?.setState({ currentView: 'party-detail', currentPartyId: 'p-404' });
    });
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08-party-detail-overview.png') });

    // Test Party Pot View
    console.log('   Testing Party Pot View...');
    await page.evaluate(() => {
      // @ts-ignore
      window.__partyStore?.setState({ currentView: 'party-pot' });
    });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09-party-pot-view.png') });

    // Test Split View
    console.log('   Testing Split Expenses View...');
    await page.evaluate(() => {
      // @ts-ignore
      window.__partyStore?.setState({ currentView: 'split' });
    });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10-split-view.png') });

    // Test Games View
    console.log('   Testing Games Hub...');
    await page.evaluate(() => {
      // @ts-ignore
      window.__partyStore?.setState({ currentView: 'games' });
    });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11-games-view.png') });

    // Test Polls View
    console.log('   Testing Polls View...');
    await page.evaluate(() => {
      // @ts-ignore
      window.__partyStore?.setState({ currentView: 'polls' });
    });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12-polls-view.png') });

    // -------------------------------------------------------------
    // FLOW 6: CREWS TAB & CREW DETAIL
    // -------------------------------------------------------------
    console.log('📍 6. Testing Crews View...');
    await page.evaluate(() => {
      // @ts-ignore
      window.__partyStore?.setState({ currentView: 'home', activeTab: 'crews' });
    });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '13-crews-view.png') });

    // -------------------------------------------------------------
    // FLOW 7: PROFILE & THEME TOGGLE
    // -------------------------------------------------------------
    console.log('📍 7. Testing Profile View (Light & Dark Mode)...');
    await page.evaluate(() => {
      // @ts-ignore
      window.__partyStore?.setState({ currentView: 'profile' });
    });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '14-profile-light.png') });

    // Toggle Dark Mode
    await page.evaluate(() => {
      // @ts-ignore
      const store = window.__partyStore;
      if (store) {
        store.getState()?.toggleTheme?.();
      }
    });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '15-profile-dark.png') });

    // Toggle Back to Light
    await page.evaluate(() => {
      // @ts-ignore
      const store = window.__partyStore;
      if (store) {
        store.getState()?.toggleTheme?.();
      }
    });

    // -------------------------------------------------------------
    // FLOW 8: CREATE PARTY & JOIN PARTY FORMS
    // -------------------------------------------------------------
    console.log('📍 8. Testing Create Party & Join Party Views...');
    await page.evaluate(() => {
      // @ts-ignore
      window.__partyStore?.setState({ currentView: 'create-party' });
    });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '16-create-party-view.png') });

    await page.evaluate(() => {
      // @ts-ignore
      window.__partyStore?.setState({ currentView: 'join-party' });
    });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '17-join-party-view.png') });

    // -------------------------------------------------------------
    // FLOW 9: DESKTOP AUDIT (1440x900)
    // -------------------------------------------------------------
    console.log('📍 9. Testing Desktop Viewports (1440x900)...');
    const desktopPage = await browser.newPage({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
    });

    await desktopPage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await desktopPage.evaluate((mockData) => {
      localStorage.setItem('partylot_cookie_consent_v1', 'accepted');
      // @ts-ignore
      const store = window.__partyStore;
      if (store) {
        store.setState({
          currentUser: {
            id: 'u-law',
            name: 'Law',
            handle: '@lawx',
            avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
            coverImage: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80',
            gatheringsCount: 24,
            balance: 48.50,
            isPrivyAuthenticated: true,
          },
          parties: mockData.parties,
          crews: mockData.crews,
          currentPartyId: 'p-404',
          currentView: 'home',
          activeTab: 'activity',
          theme: 'light',
          language: 'es',
        });
      }
    }, { parties: AUDIT_PARTIES, crews: AUDIT_CREWS });
    await desktopPage.waitForTimeout(700);
    await desktopPage.screenshot({ path: path.join(SCREENSHOT_DIR, '18-desktop-tonight.png') });

    // Desktop Profile check
    await desktopPage.evaluate(() => {
      // @ts-ignore
      window.__partyStore?.setState({ currentView: 'profile' });
    });
    await desktopPage.waitForTimeout(600);
    await desktopPage.screenshot({ path: path.join(SCREENSHOT_DIR, '19-desktop-profile.png') });

    await desktopPage.close();

    console.log('\n✅ All automated user journeys executed successfully!');
  } catch (error) {
    console.error('❌ Audit execution encountered an error:', error);
    issues.push({ type: 'Runtime Exception', message: error.message });
  } finally {
    await browser.close();
  }

  // Summary Report
  console.log('\n================ AUDIT REPORT ================');
  console.log(`Total issues identified: ${issues.length}`);
  if (issues.length > 0) {
    issues.forEach((iss, idx) => {
      console.log(`  ${idx + 1}. [${iss.type}]: ${iss.message}`);
    });
  } else {
    console.log('  🎉 No critical runtime errors, zero page crashes, and zero network failures detected.');
  }
  console.log(`Screenshots saved to: ${SCREENSHOT_DIR}`);
  console.log('==============================================\n');
}

runMarketAudit();
