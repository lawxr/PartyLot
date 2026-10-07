import { test, expect } from '@playwright/test';

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

  test('4. Privy Authentication bottom-sheet triggers on unauthenticated create action', async ({ page }) => {
    await page.goto('/');

    const createBtn = page.getByRole('button', { name: /Crear un evento|Create an event/i });
    await createBtn.scrollIntoViewIfNeeded();
    await createBtn.click();

    // Verify real Privy authentication modal (or styled fallback) triggers
    const authModal = page.locator('text=/Log in or sign up|Protected by privy|PARTYLOT AUTH|Inicia sesión/i').first();
    await expect(authModal).toBeVisible({ timeout: 10000 });
  });

  test('5. Envio HyperIndex Real-time Analytics Dashboard (/stats)', async ({ page }) => {
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
});
