import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve(process.cwd(), 'playwright-screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  console.log('🚀 Starting Full Profile Social Network & Visual Verification with Playwright...');
  const browser = await chromium.launch({ headless: true });
  
  const context = await browser.newContext({
    viewport: { width: 393, height: 852 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    colorScheme: 'light',
  });

  const page = await context.newPage();
  
  console.log('1. Navigating to http://localhost:3000 ...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Authenticate user in store with real profile attributes matching reference
  console.log('2. Authenticating user as Law (@lawx)...');
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
        currentView: 'profile',
        activeTab: 'profile',
        theme: 'light',
      });
      document.documentElement.classList.remove('dark');
    }
  });
  await page.waitForTimeout(1200);

  // Screenshot 1: Full Profile View matching reference
  console.log('📸 Capturing 01-profile-social-view.png...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-profile-social-view.png'), fullPage: false });

  // Test Follow / Star button functionality
  console.log('3. Testing Follow / Star toggle in "Your people"...');
  const starButtons = await page.$$('button[aria-label*="Follow"]');
  console.log(`Found ${starButtons.length} follow star buttons in Your people`);
  if (starButtons.length > 0) {
    // Check initial starred state
    const initialStarred = await page.evaluate(() => {
      const store = window.__partyStore?.getState?.();
      return {
        starredUserIds: store?.starredUserIds,
        isSofiStarred: store?.isUserStarred?.('u-sofi'),
      };
    });
    console.log('Initial starred state:', initialStarred);

    // Toggle star on Sofi (first button)
    console.log('Clicking star button to toggle follow...');
    await starButtons[0].click();
    await page.waitForTimeout(600);
    
    const toggledStarred = await page.evaluate(() => {
      const store = window.__partyStore?.getState?.();
      return {
        starredUserIds: store?.starredUserIds,
        isSofiStarred: store?.isUserStarred?.('u-sofi'),
      };
    });
    console.log('Toggled starred state:', toggledStarred);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-profile-star-toggled.png'), fullPage: false });

    // Toggle back to starred
    await starButtons[0].click();
    await page.waitForTimeout(400);
  }

  // Test "See all >" modal for people
  console.log('4. Testing "See all" connections modal...');
  const seeAllBtn = await page.$('button:has-text("Ver todo"), button:has-text("See all")');
  if (seeAllBtn) {
    await seeAllBtn.click();
    await page.waitForTimeout(600);
    console.log('📸 Capturing 03-see-all-people-modal.png...');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-see-all-people-modal.png'), fullPage: false });

    // Close See All modal
    const closeBtn = await page.$('div[class*="fixed"] button:has(svg.lucide-x)');
    if (closeBtn) {
      await closeBtn.click();
      await page.waitForTimeout(500);
    }
  }

  // Test Edit Profile Modal
  console.log('5. Testing Edit Profile Modal with real social fields...');
  const cameraBtn = await page.$('button[aria-label="Change photo"]');
  if (cameraBtn) {
    await cameraBtn.click();
    await page.waitForTimeout(600);
    console.log('📸 Capturing 04-edit-profile-modal.png...');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-edit-profile-modal.png'), fullPage: false });

    // Close edit profile modal
    const cancelBtn = await page.$('button:has-text("Cancelar"), button:has-text("Cancel")');
    if (cancelBtn) {
      await cancelBtn.click();
      await page.waitForTimeout(500);
    }
  }

  // Test Settings & Privacy Modal
  console.log('6. Testing Settings & Privacy Modal...');
  const settingsBtn = await page.waitForSelector('button[aria-label="Settings"]', { timeout: 4000 });
  if (settingsBtn) {
    await settingsBtn.click();
    await page.waitForTimeout(600);
    console.log('📸 Capturing 05-settings-privacy-modal.png...');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-settings-privacy-modal.png'), fullPage: false });
  }

  await browser.close();
  console.log('🎉 Profile Social Network verification successfully finished!');
}

run().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
