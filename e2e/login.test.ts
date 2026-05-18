import { device, element, by, expect as detoxExpect } from 'detox';

describe('Login flow', () => {
  beforeAll(async () => { await device.launchApp(); });
  afterAll(async () => { await device.terminateApp(); });

  it('shows login screen on cold start (unauthenticated)', async () => {
    await detoxExpect(element(by.text('Влез'))).toBeVisible();
  });

  it('shows field error on wrong password', async () => {
    await element(by.id('email-input')).typeText('test@adviz.bg');
    await element(by.id('password-input')).typeText('wrongpassword');
    await element(by.id('login-cta')).tap();
    await detoxExpect(element(by.text('Това не е правилната парола'))).toBeVisible();
    await detoxExpect(element(by.text('Грешен имейл или парола'))).toBeVisible();
  });

  it('navigates to browse after successful login', async () => {
    await element(by.id('email-input')).clearText();
    await element(by.id('password-input')).clearText();
    await element(by.id('email-input')).typeText(process.env.E2E_MENTEE_EMAIL!);
    await element(by.id('password-input')).typeText(process.env.E2E_MENTEE_PASSWORD!);
    await element(by.id('login-cta')).tap();
    await detoxExpect(element(by.text('Открий'))).toBeVisible();
  });
});
