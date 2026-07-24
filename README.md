# Deploying your job search dashboard

This folder contains your dashboard plus two optional AI-powered features.
Everything works as a plain static site with **neither** of them set up —
the directory, tracker, charts, and gap analysis all work with zero setup.

## Folder contents
- `index.html` — your dashboard
- `suggestions.json` — where the automatic scan (below) saves what it finds
- `scripts/scan-opportunities.js` — the automated scan script (runs via GitHub Actions)
- `.github/workflows/scan-opportunities.yml` — schedules the scan to run weekly
- `netlify/functions/ai-scan.js` + `netlify.toml` — optional, only needed for the
  manual "Ask AI to find more opportunities" button (see Option B below)

---

## Recommended: Option A — Automatic weekly scan + notification

This is the feature you actually want: it runs **on its own schedule**, even
when you're not on the site, and shows you a notification banner the next
time you open the page if it found something new.

### How it works
A GitHub Action runs every Monday, asks Claude (with web search) for
institutions not already in your directory, and saves anything new to
`suggestions.json`. That file gets committed to your repo, which triggers
your site to redeploy automatically. When you open the dashboard, it checks
that file and shows a banner if there's anything you haven't seen yet.

### Setup
1. **Get an Anthropic API key** — console.anthropic.com -> API Keys ->
   Create Key (requires adding a minimum $5 in prepaid credits first)
2. **Push this whole folder to a GitHub repository** (keep the folder
   structure intact, especially the `.github/workflows/` path)
3. **Add your API key as a GitHub Secret**:
   - In your repo: Settings -> Secrets and variables -> Actions -> New repository secret
   - Name: `ANTHROPIC_API_KEY`
   - Value: your key
4. **Publish the site** using either:
   - **GitHub Pages**: repo Settings -> Pages -> set Source to your `main` branch
   - **Netlify**: "Import an existing project" -> connect this same GitHub repo
     (either way works — the scan updates the repo, and your host redeploys from it)
5. **Test it manually** the first time instead of waiting until Monday:
   go to your repo's **Actions** tab -> "Weekly opportunity scan" -> "Run workflow"
6. After it runs, `suggestions.json` will update in your repo, your site
   redeploys, and the next time you open it you'll see the notification banner

### Cost
About 4 scans a month, each a small fraction of a cent to a few cents with
web search — realistically well under $1/month, likely covered by your
initial $5 for a very long time.

---

## Optional: Option B — Manual "Ask AI" button

If you *also* want the live button (search on-demand while you're on the
page, not just the weekly automatic scan), it needs a serverless proxy so
your API key isn't exposed in the browser. This only works if you host via
**Netlify** (not GitHub Pages, which can't run functions).

1. Same GitHub repo as above, deployed via Netlify (git-linked, not drag-and-drop)
2. In Netlify: Site configuration -> Environment variables ->
   add `ANTHROPIC_API_KEY` with your key
3. Trigger a redeploy — the button will now work live for any visitor

You can use Option A, Option B, both, or neither — they're independent.

## If you'd rather skip both
Totally reasonable. Remove or ignore the notification banner and the "Ask
AI" button — everything else works great without them, and you can still
use the free AI-scan feature anytime you're chatting with me here in Claude.
