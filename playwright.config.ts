import { defineConfig, devices } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Robustly read environment variables from .env file
const envFile = path.resolve(__dirname, '.env');
const env: { [key: string]: string } = {};
if (fs.existsSync(envFile)) {
  console.log('INFO: .env file found, loading environment variables.');
  const envConfig = fs.readFileSync(envFile, 'utf-8');
  envConfig.split(/\r?\n/).forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      const value = valueParts.join('=').trim();
      if (key && value) {
        const aKey = key.trim();
        process.env[aKey] = value; // Set for global setup
        env[aKey] = value; // Collect for webServer command
      }
    }
  });
} else {
  console.warn('WARN: .env file not found. Tests may fail if environment variables are required.');
}

export default defineConfig({
  globalSetup: require.resolve('./e2e/global.setup'),
  testDir: './e2e',
  timeout: 60 * 1000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: false, // Disabled: tests share a single authenticated user session
  workers: 3, // Limit workers to avoid Supabase auth API rate limits (429)
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev -- -p 3001',
    env,
    port: 3001,
    timeout: 120 * 1000,
    reuseExistingServer: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: 'e2e/.auth/user.chromium.json' },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'], storageState: 'e2e/.auth/user.firefox.json' },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'], storageState: 'e2e/.auth/user.webkit.json' },
    },
  ],
});
