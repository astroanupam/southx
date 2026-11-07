HOW TO PUT THIS ON GITHUB (no coding needed)

1. Go to github.com -> New repository. Name it, for example: astrosutras. Choose Public. Click Create repository.
2. On the new repository page click "uploading an existing file".
3. Open this GITHUB-UPLOAD folder in Windows Explorer. Press Ctrl+A to select EVERYTHING inside it
   (turn on View > Show > Hidden items first, so the ".github" and ".gitignore" items are included),
   then drag it all onto the GitHub page. Wait until every file shows as uploaded.
   If GitHub says "too many files", upload in two rounds: first the "apps" folder, then everything else.
4. Click "Commit changes".
5. In the repository: Settings > Pages > Build and deployment > Source = "GitHub Actions".
6. Open the "Actions" tab. Wait for "Deploy AstroSutras to GitHub Pages" to turn green (3-5 minutes).
   Your site: https://YOUR-GITHUB-USERNAME.github.io/astrosutras/

If the Actions run fails, open it, copy the red error text and send it to me.
More detail is in DEPLOY.md.
