/** @type {import('detox').DetoxConfig} */
module.exports = {
  testRunner: {
    args: { $0: 'jest', config: 'e2e/jest.config.js' },
    jest: { setupTimeout: 120_000 },
  },
  apps: {
    'ios.dev': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/Adviz.app',
      build: 'eas build --profile development --platform ios --local',
      launchArgs: {
        E2E_MENTEE_EMAIL: process.env.E2E_MENTEE_EMAIL ?? '',
        E2E_MENTEE_PASSWORD: process.env.E2E_MENTEE_PASSWORD ?? '',
      },
    },
    'android.dev': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'eas build --profile development --platform android --local',
      launchArgs: {
        E2E_MENTEE_EMAIL: process.env.E2E_MENTEE_EMAIL ?? '',
        E2E_MENTEE_PASSWORD: process.env.E2E_MENTEE_PASSWORD ?? '',
      },
    },
  },
  devices: {
    simulator: { type: 'ios.simulator', device: { type: 'iPhone 15 Pro' } },
    emulator: { type: 'android.emulator', device: { avdName: 'Pixel_7_Pro' } },
  },
  configurations: {
    'ios.debug': { device: 'simulator', app: 'ios.dev' },
    'android.debug': { device: 'emulator', app: 'android.dev' },
  },
};
