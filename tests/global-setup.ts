import { FullConfig } from '@playwright/test';

async function globalSetup(_config: FullConfig) {
  // Example: Set up environment variables or perform actions before tests
  console.log('Global setup for Playwright tests');
}

export default globalSetup;
