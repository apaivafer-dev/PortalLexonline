import { test, expect } from '@playwright/test';

test('Verify Login', async ({ page }) => {
    // 1. Go to page
    await page.goto('http://localhost:3000/');

    // 2. Fill login (Admin credentials from seed.ts)
    await page.fill('input[placeholder="seu@email.com"]', 'apaivafer@gmail.com');
    await page.fill('input[placeholder="••••••••"]', 'admin123');
    await page.click('button:has-text("Entrar na Plataforma")');

    // 3. Wait a bit for transition
    await page.waitForTimeout(5000);

    // 4. Capture screenshot of the post-login state
    await page.screenshot({ path: 'tests/e2e/screenshots/login-success-evidence.png', fullPage: true });

    // 5. Check for Dashboard evidence (using first() to avoid strict mode error)
    const dashboardTitle = page.locator('h1, h2').filter({ hasText: /Dashboard|Visão Geral/i }).first();
    const isDashboardVisible = await dashboardTitle.isVisible();

    if (isDashboardVisible) {
        console.log('--- LOGIN SUCCESSFUL ---');
        console.log('User logged in with: apaivafer@gmail.com / admin123');
    } else {
        console.log('--- LOGIN FAILED ---');
        const errorMsg = page.locator('div[role="alert"], .bg-red-50').first();
        if (await errorMsg.isVisible()) {
            console.log('Visible Error:', await errorMsg.innerText());
        }
    }

    await expect(dashboardTitle).toBeVisible({ timeout: 10000 });
});
