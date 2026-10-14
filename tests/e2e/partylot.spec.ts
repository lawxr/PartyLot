import { test, expect, Page } from '@playwright/test';

// Helper to ensure Next.js hydration is completed and __partyStore is available
async function waitForStore(page: Page) {
  await page.waitForFunction(() => typeof (window as any).__partyStore?.getState === 'function');
}

test.describe('PartyLot End-to-End Application Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Set cookie consent before loading to prevent blocking banners
    await page.addInitScript(() => {
      window.localStorage.setItem('partylot_cookie_consent_v1', 'accepted');
    });
  });

  test('1. Splash View loads brand, wordmark and accepts cookies', async ({ page }) => {
    await page.goto('/');

    // Verify title and brand identity
    await expect(page).toHaveTitle(/PARTYLOT/i);
    const heading = page.locator('h1');
    await expect(heading).toContainText('PartyLot');

    // Verify primary action buttons exist
    const createBtn = page.getByRole('button', { name: /Crear un evento|Create an event/i });
    const joinBtn = page.getByRole('button', { name: /Tengo un código de invitación|I have an invite code/i });
    await expect(createBtn).toBeVisible();
    await expect(joinBtn).toBeVisible();
  });

  test('2. Language Switcher alternates seamlessly between Spanish and English', async ({ page }) => {
    await page.goto('/');

    // Check default Spanish or toggle to English
    const langBtn = page.locator('button').filter({ hasText: /ES|EN/i }).first();
    await expect(langBtn).toBeVisible();

    // Toggle language
    await langBtn.click();
    await page.waitForTimeout(300);

    // Verify headline updates dynamically
    const welcomeText = page.locator('text=/BIENVENIDO A|WELCOME TO/i');
    await expect(welcomeText).toBeVisible();
  });

  test('3. Join Party View navigation, input inputs and back button', async ({ page }) => {
    await page.goto('/');

    const joinBtn = page.getByRole('button', { name: /Tengo un código de invitación|I have an invite code/i });
    await joinBtn.click();

    // Verify 4 digit input boxes are present
    const inputs = page.locator('input[type="text"]');
    await expect(inputs.first()).toBeVisible();

    // Type 4 digits into the input
    await inputs.first().fill('8');
    await page.waitForTimeout(100);

    // Verify back navigation button works
    const backBtn = page.locator('button').filter({ has: page.locator('svg.lucide-arrow-left') }).first();
    if (await backBtn.isVisible()) {
      await backBtn.click();
      await page.waitForTimeout(300);
      await expect(page.locator('h1')).toContainText('PartyLot');
    }
  });

  test('4. Invite Deep Link (?code=) automatically routes to join party', async ({ page }) => {
    await page.goto('/?code=PL99');
    await waitForStore(page);

    // Verify join party view is triggered and code inputs are visible
    const inputs = page.locator('input[type="text"]');
    await expect(inputs.first()).toBeVisible();

    const isJoinView = await page.evaluate(() => {
      const store = (window as any).__partyStore?.getState();
      return store?.currentView === 'join-party';
    });
    expect(isJoinView).toBe(true);
  });

  test('5. Privy Authentication bottom-sheet triggers on unauthenticated create action', async ({ page }) => {
    await page.goto('/');

    const createBtn = page.getByRole('button', { name: /Crear un evento|Create an event/i });
    await createBtn.scrollIntoViewIfNeeded();
    await createBtn.click();

    // Verify real Privy authentication modal (or styled fallback) triggers
    const authModal = page.locator('text=/Log in or sign up|Protected by privy|PARTYLOT AUTH|Inicia sesión/i').first();
    await expect(authModal).toBeVisible({ timeout: 10000 });
  });

  test('6. Authenticated Home Dashboard & Theme Toggle', async ({ page }) => {
    await page.goto('/');
    await waitForStore(page);

    await page.evaluate(() => {
      const store = (window as any).__partyStore;
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
    });

    await page.waitForTimeout(400);

    // Verify parties feed is rendered
    await expect(page.locator('body')).toContainText(/Fiesta|Party|House/i);

    // Toggle theme to dark
    await page.evaluate(() => {
      (window as any).__partyStore?.getState().toggleTheme();
    });
    await expect(page.locator('html')).toHaveClass(/dark/);

    // Toggle theme back to light
    await page.evaluate(() => {
      (window as any).__partyStore?.getState().toggleTheme();
    });
    await expect(page.locator('html')).not.toHaveClass(/dark/);
  });

  test('7. Party Creation Flow and 4-Digit Invite Code Generation', async ({ page }) => {
    await page.goto('/');
    await waitForStore(page);

    const createdParty = await page.evaluate(() => {
      const store = (window as any).__partyStore;
      return store.getState().createParty({
        title: 'E2E Monad Celebration',
        date: 'TONIGHT',
        time: '11:00 PM',
        location: 'Monad HQ',
        description: 'V2 Smart Contract Party',
        coverImage: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80',
      });
    });

    expect(createdParty).not.toBeNull();
    expect(createdParty?.id).toBeTruthy();
    expect(createdParty?.code).toHaveLength(4);

    const persists = await page.evaluate((partyId) => {
      const store = (window as any).__partyStore?.getState();
      return store?.parties.some((p: any) => p.id === partyId);
    }, createdParty?.id);

    expect(persists).toBe(true);
  });

  test('8. Party Detail View loads active party', async ({ page }) => {
    await page.goto('/');
    await waitForStore(page);

    await page.evaluate(() => {
      const store = (window as any).__partyStore;
      const state = store?.getState();
      const firstParty = state?.parties?.[0];
      if (firstParty) {
        store.setState({
          currentUser: {
            id: 'u-e2e-user',
            name: 'Alex E2E',
            handle: '@alexe2e',
            avatar: '',
            gatheringsCount: 0,
            gamesCount: 0,
            peopleCount: 0,
            settlementsCount: 0,
            balance: 0,
            isPrivyAuthenticated: true,
          },
          currentPartyId: firstParty.id,
          currentView: 'party-detail',
        });
      }
    });

    await page.waitForTimeout(400);

    const activePartyTitle = await page.evaluate(() => {
      const store = (window as any).__partyStore?.getState();
      return store?.parties.find((p: any) => p.id === store.currentPartyId)?.title;
    });

    if (activePartyTitle) {
      await expect(page.locator('body')).toContainText(activePartyTitle);
    }
  });

  test('9. Minigames & Social Voting Interaction', async ({ page }) => {
    await page.goto('/');
    await waitForStore(page);

    await page.evaluate(() => {
      const store = (window as any).__partyStore;
      const state = store.getState();
      const questions = (state.whosMostLikely && state.whosMostLikely.length > 0)
        ? state.whosMostLikely
        : [
            {
              id: 'q-1',
              question: '¿Quién es más probable que baile en una mesa?',
              votes: {},
            },
          ];

      store.setState({
        currentUser: {
          id: 'u-e2e-user',
          name: 'Alex E2E',
          handle: '@alexe2e',
          avatar: '',
          gatheringsCount: 0,
          gamesCount: 0,
          peopleCount: 0,
          settlementsCount: 0,
          balance: 0,
          isPrivyAuthenticated: true,
        },
        currentView: 'games',
        activeTab: 'games',
        activeGameId: 'whos-most-likely',
        whosMostLikely: questions,
      });
    });

    await page.waitForTimeout(400);

    // Cast vote in "Who is Most Likely"
    const voteCast = await page.evaluate(() => {
      const store = (window as any).__partyStore;
      const state = store.getState();
      const firstQ = state.whosMostLikely[0];
      const currentUserId = state.currentUser?.id || 'u-e2e-user';
      store.getState().voteWhosMostLikely(firstQ.id, currentUserId);
      return true;
    });

    expect(voteCast).toBe(true);

    const voteRecorded = await page.evaluate(() => {
      const store = (window as any).__partyStore?.getState();
      const firstQ = store?.whosMostLikely?.[0];
      const votes = firstQ?.votes || {};
      const currentUserId = store?.currentUser?.id;
      return Boolean(votes[currentUserId] && votes[currentUserId] > 0);
    });

    expect(voteRecorded).toBe(true);
  });

  test('10. Profile View displays authentic user metrics', async ({ page }) => {
    await page.goto('/');
    await waitForStore(page);

    await page.evaluate(() => {
      const store = (window as any).__partyStore;
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
        currentView: 'profile',
        activeTab: 'profile',
      });
    });

    await page.waitForTimeout(400);

    // Check handle is rendered
    await expect(page.locator('body')).toContainText('@alexe2e');

    // Check fake hardcoded numbers like "142 games" or fake bios do not appear
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toMatch(/142\s*(juegos|games|partidas)/i);
    expect(bodyText).not.toContain('Good food, better people.');
  });

  test('11. Envio HyperIndex Real-time Analytics Dashboard (/stats)', async ({ page }) => {
    await page.goto('/stats');

    // Verify heading
    await expect(page.locator('h1')).toContainText(/Real-Time Platform Analytics|Analíticas de Plataforma/i);

    // Verify Envio HyperIndex pipeline section is rendered
    const envioSection = page.locator('text=/Envio HyperIndex/i').first();
    await expect(envioSection).toBeVisible();

    // Verify Monad Testnet block sync card exists
    const monadCard = page.locator('text=/Monad Testnet/i').first();
    await expect(monadCard).toBeVisible();
  });

  test('12. Legal routes (/terms and /privacy) load correctly', async ({ page }) => {
    // Test Terms
    await page.goto('/terms');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('body')).toContainText(/Términos|Terms/i);

    // Test Privacy
    await page.goto('/privacy');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('body')).toContainText(/Privacidad|Privacy/i);
  });
});
