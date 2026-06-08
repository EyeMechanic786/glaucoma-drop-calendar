# Glaucoma Drop Calendar

A browser-based eye drop schedule and reminder for glaucoma clinics. Staff configure patient details and medications; patients use a large, high-contrast checklist with weekly or monthly views. No server or database—schedules are stored only in the browser on each device.

## Live app

**https://eyemechanic786.github.io/glaucoma-drop-calendar/**

Every push to `main` rebuilds and redeploys the site via GitHub Actions.

## Features

- **Three-step workflow:** patient & visit details → prescribe medications → patient schedule
- **Preset glaucoma medications** with colour-coded bottle caps (including oral options)
- **Flexible dosing:** frequency, eye (left / right / both), and time slots (morning, noon, evening, night)
- **Patient schedule:** daily timeline with checkboxes, week view, and full month calendar
- **Print & PDF:** high-contrast print layout and colour **Save as PDF** for handouts
- **Accessible UI:** skip link, clear navigation, large touch targets
- **Install on phones:** progressive web app (PWA) — add to home screen on iPhone and Android
- **Drop reminders:** optional alert 15 minutes before each scheduled dose time

## Install on a mobile phone

**Live link:** https://eyemechanic786.github.io/glaucoma-drop-calendar/

### Before you start

- Use **Wi‑Fi or mobile data** (internet needed the first time).
- **Android:** use **Chrome** (recommended).
- **iPhone/iPad:** use **Safari** (required for Add to Home Screen).
- Schedules stay **only on that device** — nothing is sent to a server.

### Android (Samsung, Pixel, etc.)

1. Open **Chrome** and go to the live link above.
2. Install using **one** of these:
   - Tap **Install** in the banner at the bottom (if shown), **or**
   - Tap **⋮** (menu) → **Install app** or **Add to Home screen** → **Install**.
3. Confirm if asked.
4. Open **Drop Calendar** from your home screen.

**Turn on drop reminders (optional):**

1. Open the app from the home screen → **3. Patient schedule**.
2. Under **Drop reminders**, enable **Remind me 15 minutes before each dose time**.
3. Tap **Allow** when Chrome asks for notifications.
4. If alerts don’t appear: **Settings** → **Apps** → **Chrome** (or the installed app) → **Notifications** → On.

### iPhone / iPad (iOS)

1. Open **Safari** (not Chrome for this step) and go to the live link above.
2. Tap **Share** (square with arrow, bottom of screen).
3. Tap **Add to Home Screen** → edit the name if you like → **Add**.
4. Open the app from your home screen.

**Turn on drop reminders (optional):**

1. Open the app from the home screen → **3. Patient schedule**.
2. Enable **Remind me 15 minutes before each dose time**.
3. Tap **Allow** when iOS asks for notifications.
4. If reminders don’t appear: **Settings** → **Notifications** → **Drop Calendar** / Safari → allow notifications.  
   iOS background reminders are more limited than Android; keep the app installed and check the schedule if you miss an alert.

### After installing (both platforms)

| Step | Action |
|------|--------|
| Clinic setup | **1. Patient details** → **2. Prescribe meds** → **3. Patient schedule** |
| Daily use | Open from home screen → mark doses on the calendar |
| Print / PDF | Patient schedule → **Weekly** or **Full month** → **Print** or **Save as PDF** |
| New patient (same phone) | **Clear all data** on Patient details only when starting fresh |

### Quick comparison

| | Android | iPhone / iPad |
|---|---------|----------------|
| Browser | Chrome | Safari |
| Install | Menu → Install app / Add to Home screen | Share → Add to Home Screen |
| Opens like an app | Yes | Yes |
| Reminders | Usually good if notifications allowed | Best with app open; background alerts limited |

### Troubleshooting

- **No “Add to Home Screen” on iPhone** — open the link in **Safari**, not Chrome.
- **No “Install app” on Android** — try Chrome menu → **Add to Home screen** or **Install app**.
- **Old version** — close the app fully and reopen while online.
- **Schedule missing** — data is per device; enter the schedule again on a new phone.

### For the clinic

Share the live link by text, email, or QR code. Short patient instruction:

> Open this link in Safari (iPhone) or Chrome (Android), add to home screen, then turn on reminders on the Patient schedule tab.

### Developers: PWA icons

To regenerate home-screen icons after changing `public/pwa-icon.svg`, run `npm run icons`.

## Privacy

- **No patient health data is sent over the internet.**
- Schedules are saved only on the device that created them, using browser `localStorage`.
- The hosted app is a public static website; anyone can open the URL, but data does not sync between devices unless you add a backend later.

## How to use (clinic workflow)

1. **Patient details** — Enter name, clinic date, and optional header instructions.
2. **Prescribe meds** — Add one or more drops from the preset list (search/filter supported). Set frequency, eye, and times.
3. **Patient schedule** — Review the calendar, mark doses as taken, switch between week and month views, then print or save a PDF for the patient.

Use **Clear all data** in the footer only when starting a new patient on the same device.

## Local development

Requirements: [Node.js](https://nodejs.org/) 18+ (22 recommended).

```bash
git clone https://github.com/EyeMechanic786/glaucoma-drop-calendar.git
cd glaucoma-drop-calendar
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |

For local dev, asset paths use `/`. Production builds use `/glaucoma-drop-calendar/` for GitHub Pages (see `vite.config.ts`).

## Project structure

```
src/
  data/          Medication presets and time slot definitions
  ui/            Clinic forms, patient calendar, print/PDF layouts
  main.ts        App shell and navigation
  schedule.ts    Calendar and dose scheduling logic
  storage.ts     localStorage load/save
  state.ts       App state and focused re-renders
```

## Tech stack

- [Vite](https://vitejs.dev/) + TypeScript (vanilla, no React)
- [html2pdf.js](https://github.com/eKoopmans/html2pdf.js) for PDF export
- GitHub Pages + GitHub Actions (`.github/workflows/deploy-pages.yml`)

## Print & PDF tips

- In the browser print dialog, enable **Background graphics** for colour cap badges on paper.
- **Save as PDF** downloads a colour handout directly (no need to pick “Microsoft Print to PDF”).

## Repository

https://github.com/EyeMechanic786/glaucoma-drop-calendar

## License

No license file is included yet. Contact the repository owner if you wish to reuse or redistribute the code.
