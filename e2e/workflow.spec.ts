import { test, expect } from '@playwright/test';

test.describe('Phylax Full Workflow', () => {

  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'admin@phylax.dev');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/queue');
  });

  test('should login and see the triage queue', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('Triage Queue');
    await expect(page.locator('nav')).toContainText('Admin User');
    await expect(page.locator('nav')).toContainText('Logout');
  });

  test('should submit a new incident', async ({ page }) => {
    await page.click('a[href="/submit"]');
    await page.waitForURL('**/submit');

    await page.fill('input[type="text"]', 'Playwright Test Incident');
    await page.fill('textarea', 'This incident was created by an automated Playwright test');
    await page.selectOption('select', { index: 1 });

    await page.click('button[type="submit"]');

    await expect(page.locator('h1')).toHaveText('Incident Submitted');
    await expect(page.getByText('PHX-', { exact: false })).toBeVisible();
  });

  test('should navigate to incident detail from queue', async ({ page }) => {
    const firstTicketLink = page.locator('table tbody a').first();
    const ticketNumber = await firstTicketLink.textContent();

    await firstTicketLink.click();
    await page.waitForURL('**/incidents/**');

    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=Description')).toBeVisible();
    await expect(page.locator('text=Activity Log')).toBeVisible();
  });

  test('should post a comment on an incident', async ({ page }) => {
    const firstTicketLink = page.locator('table tbody a').first();
    await firstTicketLink.click();
    await page.waitForURL('**/incidents/**');

    await page.fill('textarea[placeholder="Add a comment..."]', 'Playwright E2E comment');
    await page.click('button:has-text("Post Comment")');

    await expect(page.locator('text=Playwright E2E comment')).toBeVisible();
  });

  test('should view the dashboard with Little\'s Law', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');

    await expect(page.locator('h1')).toHaveText('Dashboard');
    await expect(page.getByText('Queue Health')).toBeVisible();
    await expect(page.getByText('Queue Depth (L)')).toBeVisible();
    await expect(page.getByText('Arrival Rate')).toBeVisible();
    await expect(page.getByText('Active Incidents by Severity')).toBeVisible();
  });

  test('should access settings as admin', async ({ page }) => {
    await page.goto('http://localhost:3000/settings');

    await expect(page.locator('h1')).toHaveText('Settings');
    await expect(page.getByRole('heading', { name: 'Queue Strategy' })).toBeVisible();
    await expect(page.getByText('FIFO', { exact: true })).toBeVisible();
    await expect(page.getByText('SLAP', { exact: true })).toBeVisible();
  });

  test('should view archive page', async ({ page }) => {
    await page.click('a[href="/archive"]');
    await page.waitForURL('**/archive');

    await expect(page.locator('h1')).toHaveText('Archive');
    await expect(page.locator('table')).toBeVisible();
  });

  test('should logout and redirect to login', async ({ page }) => {
    await page.click('button:has-text("Logout")');
    await page.waitForURL('**/login');

    await expect(page.locator('text=Sign in to continue')).toBeVisible();
  });
});

test('submitter should not see actions on incident detail', async ({ page }) => {
  // Login as submitter — different role than the admin used in other tests
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="email"]', 'submitter@phylax.dev');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/queue');

  // Navigate to first incident
  const firstTicketLink = page.locator('table tbody a').first();
  await firstTicketLink.click();
  await page.waitForURL('**/incidents/**');

  // Verify actions section is not visible for submitter role
  await expect(page.locator('text=Move to')).not.toBeVisible();
  await expect(page.locator('text=Settings')).not.toBeVisible();
});


