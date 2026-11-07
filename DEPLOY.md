# Publishing AstroSutras on GitHub Pages

The web app is fully static: the calculation engine (Python + Skyfield + JPL ephemeris) runs inside the visitor's browser, and accounts and saved charts are stored encrypted in that browser. No server, database or paid service is needed.

## One-time steps
1. Create a new GitHub repository (for example `astrosutras`). Public is simplest for Pages on a free account.
2. Upload the project (see "What to upload").
3. In the repository: **Settings -> Pages -> Build and deployment -> Source: GitHub Actions**.
4. Push to `main` (or open the **Actions** tab and run "Deploy AstroSutras to GitHub Pages"). After 3-5 minutes the site is at `https://<your-username>.github.io/<repo-name>/`.

## What to upload
Upload everything in this folder EXCEPT: `node_modules`, `.next`, `out`, `.venv`, `services/api/data`, `apps/web/public/engine/pyodide` (these are rebuilt automatically). Keep `.github/workflows/deploy.yml`, `apps/web/package-lock.json` and `apps/web/public/engine/data/*.part0/part1` (the ephemeris, split into two files so the GitHub web uploader's 25 MB per-file limit is respected).
You can drag folders into the GitHub web page, use GitHub Desktop, or `git push`.

## How it works for users
- First chart calculation downloads the engine (about 40 MB, cached afterwards by the browser).
- Accounts are local to one browser on one device. Use **Export backup** to save charts as a file and **Import backup** to load them elsewhere. Clearing browser data or forgetting the password loses the charts (there is no password reset, because nothing is stored on a server).
- Passwords are never stored; they derive an encryption key (PBKDF2, 310,000 rounds + AES-GCM).

## Local preview
```
cd apps/web
npm install
npm run dev        # http://localhost:3000
npm test           # unit tests
npm run smoke      # engine check against JHora reference chart REF-002
npm run build      # static site in apps/web/out
```