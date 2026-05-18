import { device, element, by, expect as detoxExpect } from 'detox';

describe('Booking flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    await element(by.id('email-input')).typeText(process.env.E2E_MENTEE_EMAIL!);
    await element(by.id('password-input')).typeText(process.env.E2E_MENTEE_PASSWORD!);
    await element(by.id('login-cta')).tap();
    await detoxExpect(element(by.text('Открий'))).toBeVisible();
  });

  it('can open mentor profile from browse', async () => {
    await element(by.id('mentor-card-0')).tap();
    await detoxExpect(element(by.text('Запази час'))).toBeVisible();
  });

  it('booking CTA is visible (offline simulation requires network conditioning — deferred)', async () => {
    // Full offline test requires Detox network conditioning setup in CI
    // This verifies the booking UI renders; offline behavior is tested via unit tests
    await detoxExpect(element(by.text('Запази час'))).toBeVisible();
  });
});
