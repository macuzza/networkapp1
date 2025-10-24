# Asteroids (HTML5 Canvas)

A minimal Asteroids clone written in vanilla HTML/CSS/JS.

## Controls
- Left/Right: rotate
- Up: thrust
- Space: shoot
- R: restart after game over

## Local Run
Open `index.html` directly, or serve locally:

```bash
python3 -m http.server 5173
# then open http://localhost:5173
```

## Deploy to GitHub Pages
After pushing to GitHub, the included workflow deploys automatically to Pages using GitHub Actions.

### One-time setup
1. Create a new GitHub repository (public recommended).
2. Push the code and ensure Actions are enabled (default).

### Commands
Replace YOUR_USER and YOUR_REPO accordingly.

```bash
git init -b main
git add .
git commit -m "feat: initial asteroids game"
git remote add origin git@github.com:YOUR_USER/YOUR_REPO.git
# or: https://github.com/YOUR_USER/YOUR_REPO.git

git push -u origin main
```

The GitHub Actions workflow in `.github/workflows/pages.yml` will build and publish to Pages. Once it finishes, if prompted, set Pages source to "GitHub Actions" in Settings → Pages.
