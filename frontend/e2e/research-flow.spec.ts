import { test, expect } from '@playwright/test';

// Runs against the backend's demo mode (no ANTHROPIC_API_KEY needed), which
// makes this deterministic and fast enough for CI. Start the backend
// separately first: `uvicorn app.main:app --port 8000` from backend/.
test('full flow: start research -> watch progress -> review report -> export', async ({ page }) => {
  await page.goto('/');

  await page.getByTestId('topic-input').fill('E2E test topic');
  await page.getByTestId('start-button').click();

  await expect(page).toHaveURL(/\/report\/\d+/);

  // Progress stage should render while the demo job runs...
  await expect(page.getByTestId('stage-detail')).toBeVisible({ timeout: 5000 });

  // ...and the report should appear once the demo job finishes.
  await expect(page.getByTestId('insight-card').first()).toBeVisible({ timeout: 15_000 });
  const cards = page.getByTestId('insight-card');
  await expect(cards).toHaveCount(3);

  // Mark the first insight relevant and confirm the badge appears.
  await cards.first().getByRole('button', { name: '👍 Релевантно' }).click();
  await expect(cards.first().getByText('Релевантно', { exact: true })).toBeVisible();

  // Export links should point at the backend export endpoint.
  const mdLink = page.getByRole('link', { name: 'Экспорт в Markdown' });
  await expect(mdLink).toHaveAttribute('href', /\/export\?format=md$/);
});

test('table view shows the same insights and relevance marking still works', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('topic-input').fill('Table view test topic');
  await page.getByTestId('start-button').click();
  await expect(page.getByTestId('insight-card').first()).toBeVisible({ timeout: 15_000 });

  await page.getByRole('button', { name: 'Таблица' }).click();

  const rows = page.getByTestId('insight-row');
  await expect(rows).toHaveCount(3);
  // Switching view is presentation-only — cards disappear, same data survives as rows.
  await expect(page.getByTestId('insight-card')).toHaveCount(0);

  await rows.first().getByRole('button', { name: '👎' }).click();
  await expect(rows.first().getByText('Не релевантно', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Карточки' }).click();
  await expect(page.getByTestId('insight-card').first().getByText('Не релевантно', { exact: true })).toBeVisible();
});
