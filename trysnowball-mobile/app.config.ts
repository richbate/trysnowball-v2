import { ExpoConfig, ConfigContext } from '@expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'TrySnowball',
  slug: 'trysnowball-mobile',
  version: '1.0.0',
  orientation: 'portrait',
  // icon: './assets/icon.png',  // Using default Expo icon for now
  userInterfaceStyle: 'automatic',
  splash: {
    // image: './assets/splash.png',  // Using default Expo splash for now
    resizeMode: 'contain',
    backgroundColor: '#2563EB',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.trysnowball.mobile',
    buildNumber: '1',
    infoPlist: {
      NSCameraUsageDescription: 'This app does not use the camera.',
      NSPhotoLibraryUsageDescription: 'This app does not access your photo library.',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#2563EB',
    },
    package: 'com.trysnowball.mobile',
    versionCode: 1,
  },
  web: {
    favicon: './assets/favicon.png',
  },
  extra: {
    eas: {
      projectId: 'your-project-id-here',
    },
  },
  plugins: [
    'expo-secure-store',
  ],
});