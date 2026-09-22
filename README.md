# Pin Paws email previews

A small Vite + React site for sharing the Pin Paws transactional email templates. Pick a template from the dropdown
in the top bar to see it rendered, at desktop (640px) or phone (375px) width, in light or dark mode. Dark mode shows
what the email's own dark-mode styles look like in mail apps that use them. Above each email, a strip shows its
subject line and preheader the way an inbox would.

Link to one email with `?t=<name>`, and pick the mode with `&theme=light` or `&theme=dark`, for example
`?t=07-payment-failed&theme=dark`. Without `theme`, the viewer's system setting decides.

## Update the emails

The emails are built in the sibling `email-templates/` kit. After changing them there:

```
cd ../email-templates && python3 build.py
cd ../email-preview && npm run sync
```

`npm run sync` copies `emails/*.html` and `pinpaws-template.html` into `public/templates/` and rewrites
`src/templates.json` (the dropdown list, with each email's subject and preheader). Commit both, then push.

## Run locally

```
npm install
npm run dev
```

## Publish on GitHub Pages

1. Push this folder to a GitHub repo on the `main` branch.
2. In the repo, go to **Settings → Pages** and set **Source** to **GitHub Actions**.
3. Every push to `main` runs `.github/workflows/deploy.yml`, which builds the site and publishes it at
   `https://<user>.github.io/<repo>/`.

The site uses relative paths (`base: './'` in `vite.config.js`), so the repo can have any name.
