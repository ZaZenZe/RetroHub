import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.retrohub.app',
  appName: 'RetroHub',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    allowNavigation: ['http://10.0.2.2', 'http://localhost', 'http://127.0.0.1'],
    cleartext: true,
  },
};

export default config;
