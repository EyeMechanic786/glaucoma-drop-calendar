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
