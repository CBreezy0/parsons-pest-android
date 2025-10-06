# Parsons Pest Detectives — Android (Expo) MVP

A zero-cost demo Android app that wraps the Parsons Pest Detectives website in a high‑quality WebView with native quick actions (Call, Text, Email, Directions, Book).

---

## Features
- WebView of **https://www.parsonspestdetectives.com/**
- Native quick actions: **Call, Text, Email, Directions, Book**
- Clean header, loading indicator
- Ready for CI: GitHub Actions builds a **debug APK** artifact on each push

---

## Getting Started (Local)
1. Install Node 18/20 and npm.
2. Install Expo tools: `npm i -g expo-cli`
3. Install deps: `npm install`
4. Start: `npm run start`
5. On Android, open **Expo Go** and scan the QR to preview.

> No fees for the demo. Play Store publishing later requires the $25 Google Play fee.

---

## File Structure
```
parsons-pest-android/
├─ App.tsx
├─ package.json
├─ app.json
├─ .gitignore
├─ assets/
│  ├─ icon.png
│  ├─ splash.png
│  └─ adaptive-icon.png
└─ .github/workflows/
   └─ android-debug.yml
```

---

## GitHub Actions (CI)
- Workflow: `.github/workflows/android-debug.yml`
- On push to `main`, it:
  - Installs Node and dependencies
  - **Prebuilds Android** native project (Expo)
  - Runs Gradle to **assemble a debug APK**
  - Uploads `app-debug.apk` as an **artifact**

**Download the APK** from the **Actions** tab → latest run → **Artifacts**.

---

## Customization
- Update contact details in `app.json > expo.extra`
- Replace `assets/icon.png`, `assets/splash.png`, `assets/adaptive-icon.png` with your branding
- To deep-link to a booking section, adjust the `openBooking` URL/anchor in `App.tsx`

---

## Going Further
- Replace WebView with native screens later (Services, Get Protected form, etc.)
- Add push notifications, offline caching, analytics
- Create a release workflow to generate a **signed AAB** for the Play Store
