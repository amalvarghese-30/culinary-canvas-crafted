# Capacitor Mobile App Build

This project ships with [Capacitor](https://capacitorjs.com) wired up so the
same TanStack Start codebase can be packaged as a native Android / iOS app.

## Prerequisites

- macOS with Xcode (iOS) and/or Android Studio (Android)
- Node 20+, JDK 17+

## One-time setup

```bash
# Add the platforms (already installed as dev deps)
npx cap add android
npx cap add ios
```

## Build & sync

```bash
# Generate the static build that Capacitor wraps
bun run build

# Copy assets into the native projects
npx cap sync
```

## Open native IDEs

```bash
npx cap open android   # opens Android Studio
npx cap open ios       # opens Xcode
```

From there, click "Run" to launch on a simulator or physical device.

## Production notes

- The `capacitor.config.ts` `webDir` points at `dist/client` (TanStack Start
  Vite output). If you change the bundler output, update it accordingly.
- The app shell is the published HTML. Server functions still need the live
  TanStack server — either point Capacitor to your deployed origin via
  `server.url` in `capacitor.config.ts`, or proxy through the device.
- Add splash screen + app icons under `android/app/src/main/res/` and
  `ios/App/App/Assets.xcassets/`.

## Push notifications (optional)

Web Push subscriptions are stored in the `push_subscriptions` Lovable Cloud
table; for native push, add `@capacitor/push-notifications` and wire FCM
(Android) / APNs (iOS) when you're ready to ship background notifications.
