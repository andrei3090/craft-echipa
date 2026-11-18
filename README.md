# Craft Cafe · Echipa

Tablet app for the café team: daily checklist, rounds every 2 hours, fridge temperatures,
closing report, weekly and monthly cleaning, incident and goods-receipt forms, and the team manual.

- Each person signs in with an avatar and a 4-digit PIN. No names are stored anywhere.
- Every save becomes one row in a Google Sheet and one PDF in Google Drive.
- Works offline: saves wait on the tablet and are sent when the connection is back.
- This repository holds only the app shell. Checklists, manual and data come from the
  Google Apps Script backend after sign-in, so nothing internal is public.

## Stack

React 18 · TypeScript · Vite · Tailwind CSS 4 · TanStack Query · Zustand · Zod ·
idb-keyval (offline outbox) · vite-plugin-pwa (installable, offline) · DOMPurify · lucide-react · sonner · Vitest.

## Development

```bash
npm install
npm run dev      # uses a local mock backend (PIN 2580)
npm test
npm run build
```

`public/config.json` holds the URL of the Apps Script web app (`{"api": "https://script.google.com/macros/s/.../exec"}`).
Pushing to `main` builds and publishes to GitHub Pages.
