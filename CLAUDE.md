# Project Guidelines

## Commands

- Run Android: `npm run android` or `npx react-native run-android`
- Run iOS: `npm run ios` or `npx react-native run-ios`
- Start Metro: `npm start`
- Lint: `npm run lint`
- Build (Android): `cd android && ./gradlew assembleDebug`

## Code Style

- **TypeScript**: Use TypeScript for all new files and components.
- **React Native**: Use functional components with Hooks (React 19).
- **Styling**: Use `StyleSheet.create` for styling. Avoid ad-hoc inline styles.
- **Error Handling**: Use early returns for error handling and permission checks.
- **Location Services**: 
  - Always use `requestLocationPermission` before accessing geolocation.
  - Use `promptForEnableLocationIfNeeded` on Android before calling `getCurrentPosition`.
  - Use high-accuracy fallback logic (GPS -> Network) for better reliability.

## Android Specifics

- **New Architecture**: Currently **disabled** (`newArchEnabled=false`) in `gradle.properties` for library compatibility.
- **Compile SDK**: Set to **36** to satisfy dependency requirements.
- **Main Activity**: `MainActivity.kt` must override `onCreate` with `super.onCreate(null)` for `react-native-screens` support.
- **WebView**: `android:usesCleartextTraffic="true"` is enabled in `AndroidManifest.xml` for map support.

## Workflow

- Before making native changes, verify the impact on both Android and iOS.
- When adding new native libraries, remind the user to rebuild the app.
- Use `adb logcat` for debugging Android-specific crashes.
