import { test, expect } from '@playwright/test';

test.describe('LexOnline Full Flow', () => {

    // Unique email for each test run
    const testEmail = `test.user.${Date.now()}@example.com`;

    test('should register, calculate and generate lead', async ({ page }) => {
        page.on('console', msg => console.log('BROWSER:', msg.text()));
        page.on('pageerror', error => console.error('BROWSER ERROR:', error.message));

        // 1. Go to page
        await page.goto('/');

        // 2. Go to registration
        await page.click('text=Cadastre-se grátis');
        await expect(page.locator('text=Comece grátis hoje!')).toBeVisible();

        // 3. Fill registration
        await page.fill('input[placeholder="Seu nome"]', 'Test User E2E');
        await page.fill('input[placeholder="seu@email.com"]', testEmail);
        await page.fill('input[placeholder="••••••••"]', 'ComplexPass123!');
        await page.fill('input[placeholder="(00) 00000-0000"]', '11999999999');
        await page.fill('input[placeholder="Nome do escritório"]', 'LexTest Advogados');
        await page.click('button:has-text("Criar minha conta")');

        // 4. Wait for Dashboard
        await page.screenshot({ path: 'tests/e2e/screenshots/after-register-click.png' });

        // Wait for the loading screen to disappear and Dashboard to appear
        await expect(page.locator('h1 >> text=Dashboard')).toBeVisible({ timeout: 30000 });
        await expect(page.locator('text=LEXTEST ADVOGADOS')).toBeVisible({ timeout: 10000 });

        // 5. Go to Calculator
        await page.click('aside button:has-text("Calculadora")');
        // Usar h1.sr-only ou Dados do Contrato que é mais estável que o título do escritório
        await expect(page.locator('h1.sr-only')).toContainText('Calculadora de Rescisão');
        await expect(page.locator('text=Dados do Contrato')).toBeVisible();

        // 6. Fill Calculator
        // Ajustado para o label real no código: "Último Salário Bruto"
        await page.locator('label:has-text("Último Salário Bruto") + div input').fill('5000');
        
        // Garantir que as datas estão preenchidas (podem vir com defaults, mas melhor garantir)
        await page.locator('label:has-text("Data de Admissão") + div input').fill('2023-01-01');
        await page.locator('label:has-text("Data de Afastamento") + div input').fill('2024-01-01');

        await page.click('button:has-text("Calcular Agora")');

        // 7. Lead form
        await expect(page.locator('text=Cálculo Pronto!')).toBeVisible({ timeout: 10000 });
        await page.fill('input[placeholder="Nome completo"]', 'Lead Test');
        await page.fill('input[placeholder="seu@email.com"]', 'lead@example.com');
        // Placeholder real é (00) 90000-0000
        await page.fill('input[placeholder="(00) 90000-0000"]', '11988888888');

        // Consent
        await page.click('text=Concordo com o processamento dos meus dados');
        await page.click('button:has-text("Ver Resultado Completo")');

        // 8. Result
        await expect(page.locator('text=Resultado do Cálculo')).toBeVisible();
        await expect(page.locator('text=Estimativa Educativa')).toBeVisible();
        await page.screenshot({ path: 'tests/e2e/screenshots/result.png', fullPage: true });
    });
});
