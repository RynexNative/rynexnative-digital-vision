# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/c656679e-92d1-424f-888e-95cf20eb24c0

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/c656679e-92d1-424f-888e-95cf20eb24c0) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

The site is deployed to GitHub Pages from the `gh-pages` branch:

```sh
npm run deploy
```

This builds the app into `dist/` and pushes it to the `gh-pages` branch. The custom domain
file lives in `public/CNAME`, so it is copied into every build and `rynexnative.com` is kept
after each deploy. In the repository settings, Pages should be set to
"Deploy from a branch" → `gh-pages` / `(root)`.

## Backend (Django API)

Forms, the estimator and the Tahadhari alerts talk to the Django API in the separate
repository **RynexNative/rynexnative-backend**, deployed at `https://api.rynexnative.com`.

- The API address is set in `.env.production` (`VITE_API_URL`). For local work,
  `.env.development` points to `http://127.0.0.1:8000` (run the backend with `python manage.py runserver`).
- The team manages alerts, estimate requests, messages and newsletter subscribers in the
  Django admin: `https://api.rynexnative.com/admin/` (`/#/admin` on the website redirects there).
- If the API cannot be reached, the alerts pages fall back to the built-in starter alerts
  in `src/features/alerts/fallback-alerts.ts`.

Pages:

- `/#/tahadhari`: Swahili security alerts with WhatsApp sharing
- `/#/estimate`: project price estimator (prices live in `src/features/estimator/pricing.ts`)

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
