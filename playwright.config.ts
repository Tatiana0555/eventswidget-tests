import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    headless: process.env.CI ? true : false,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 10000,
    baseURL: 'https://dev.3snet.info',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Разрешаем доступ к clipboard для тестов копирования
    permissions: ['clipboard-read', 'clipboard-write'],
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        browserName: 'chromium',
        // Используйте 'chrome' для системного Chrome или оставьте 'chromium' для встроенного Chromium от Playwright
        // channel: 'chrome', // Раскомментируйте, если хотите использовать системный Chrome
      },
    },
  ],
});
