# Smart Research Tracker

Save pages, organize links, and chat about your research. Dashboard + Chrome extension.

## Quick Start (60 seconds)

1) Build and open the dashboard
- macOS/Linux:
```bash
pnpm install && pnpm build && open dist/index.html
```
- Windows (PowerShell):
```powershell
npm install; npm run build; start dist\index.html
```

2) Load the Chrome extension
- Go to `chrome://extensions` → enable Developer mode → Load unpacked → pick `extension/`
- In extension Details, enable “Allow access to file URLs”

3) Point the extension to the dashboard
- Extension → gear (⚙️) → Dashboard URL:
  - macOS/Linux: `file:///ABSOLUTE/PATH/TO/dist/index.html`
  - Windows: `file:///C:/ABSOLUTE/PATH/TO/dist/index.html`

4) Optional: enable AI chat
- Dashboard → Settings → toggle “Use my OpenAI API key” → paste your key

Done. Click the extension on any page → Save to Research → open Dashboard.

## Install Options

- Local file (no hosting): use the steps above.
- Static host: `pnpm build` → upload `dist/` to any host → set Dashboard URL to your site.
- Vercel (optional serverless): import repo → deploy → set provider keys server-side only (e.g., `TOGETHER_API_KEY`).

## Troubleshooting

- Dashboard won’t open: check Dashboard URL (must be file:///…/dist/index.html or your https URL).
- Chat not working: add your OpenAI key in Dashboard → Settings.
- Extension can’t access local file: enable “Allow access to file URLs” in extension Details.
- Build errors: use Node 18+, then reinstall and rebuild.

## License

MIT


