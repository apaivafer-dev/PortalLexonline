import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: 1,
    reporter: 'html',
    use: {
        baseURL: 'http://localhost:3000',
        trace: 'on-first-retry',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    webServer: [
        {
            command: 'npx vite --port 3000',
            env: {
                VITE_API_URL: 'http://localhost:3001/api'
            },
            port: 3000,
            timeout: 120000,
            reuseExistingServer: true,
            cwd: './'
        },
        {
            command: 'cd server && npm.cmd run dev',
            port: 3001,
            timeout: 120000,
            reuseExistingServer: true,
            cwd: './'
        }
    ],
});
