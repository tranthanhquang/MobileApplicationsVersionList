# APK Version Portal

Single-page React app for listing APK build versions with a token-based API (Apps Script). Registration can be enabled or disabled.

## 1) Frontend setup (Vite + React)

1. Install deps:

```bash
npm install
```

2. Create `.env` from `.env.example` and fill values:

- `VITE_API_BASE_URL` (Apps Script Web App URL, e.g. `https://script.google.com/macros/s/.../exec`)
- `VITE_REPO_NAME` (GitHub repo name for Pages)

3. Run locally:

```bash
npm run dev
```

4. Build:

```bash
npm run build
```

## 2) API setup

Set up your Apps Script API endpoints following your backend spec:

- `POST ?path=/login`
- `POST ?path=/token/refresh`
- `GET ?path=/token/check`
- `GET ?path=/apks&accessToken=...`

## 3) GitHub Pages deploy

1. In GitHub repo settings → Pages, set source to `gh-pages` (or `docs` if you prefer).
2. Build and push `dist/` to `gh-pages` branch. Example:

```bash
npm run build
npx gh-pages -d dist
```

If you use a custom domain, set `VITE_BASE_PATH=/`.

## Notes

- The app uses username/password and stores tokens in `localStorage`.
- If you want to disable registration, hide the Register tab in `src/App.jsx`.
- OneDrive links are shown directly as download URLs.
