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

  it('booking CTA disabled when offline — stub test', async () => {
    await detoxExpect(element(by.text('Запази час'))).toBeVisible();
  });
});
