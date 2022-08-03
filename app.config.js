import "dotenv/config";

export default {
  name: "callingio-mobile-app",
  displayName: "callingio-mobile-app",
  expo: {
    name: "callingio-mobile-app",
    slug: "callingio-mobile-app",
    version: "1.0.0",
    orientation: "portrait",
    assetBundlePatterns: ["**/*"],
    plugins: [
      "sentry-expo",
      "expo-av",
      "expo-camera",
      "expo-contacts",
      "expo-media-library",
      "expo-notifications",
      "expo-image-picker",
      "expo-file-system",
    ],
    hooks: {
      postPublish: [
        {
          file: "sentry-expo/upload-sourcemaps",
          config: {
            organization: "2600h",
            project: "2600hz",
            authToken: process.env.SENTRY_AUTH_TOKEN,
          },
        },
      ],
    },
    android: {
      googleServicesFile:
        "./whitelabel_config/google-services.json",
    },
  },
};
