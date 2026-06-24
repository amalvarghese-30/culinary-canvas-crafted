import type { CapacitorConfig } from "@capacitor/cli";

// Capacitor wrapper config for Mōmo House.
// To build a native mobile app locally:
//   1. bun run build
//   2. npx cap add ios          (or android)
//   3. npx cap sync
//   4. npx cap open ios         (opens Xcode / Android Studio)
//
// The `server.url` below points at the deployed web build so OTA updates
// work without re-shipping the native binary. Remove `server` to ship a
// fully offline app bundling /dist.
const config: CapacitorConfig = {
  appId: "house.momo.app",
  appName: "Mōmo House",
  webDir: "dist",
  bundledWebRuntime: false,
  server: {
    androidScheme: "https",
    // url: "https://your-domain.com", // uncomment for OTA
    cleartext: false,
  },
  ios: { contentInset: "always" },
  android: { backgroundColor: "#0b0b0c" },
};

export default config;
