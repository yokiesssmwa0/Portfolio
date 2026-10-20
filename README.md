# Folio Foundry

A responsive portfolio generator with exactly three designs: Simple, Modern, and Creative. Users can create an account, enter portfolio information, save and retrieve private drafts, select a template, preview the result, and edit or delete drafts.

## Run locally

```sh
cd my-portfolio
npm ci
npm run dev
```

The local demo can be entered without a database, but it stores drafts only in the current browser. For cloud accounts and online persistence, configure Supabase below.

## Configure Supabase

1. Create a Supabase project and open its SQL Editor.
2. Run [`supabase/schema.sql`](supabase/schema.sql). It creates the portfolio table and row-level security policies so only the signed-in owner can access their rows.
3. In Folio Foundry, expand **Connect an online database** and enter the project URL and publishable (anon) key. These values are saved in that browser; each user signs in with their own Supabase account.

Never enter a Supabase `service_role` key in the website. Profile images are resized in the browser and stored with the portfolio data.

## Publish

The GitHub Actions workflow builds `my-portfolio` and deploys its `dist` directory to GitHub Pages on pushes to `main`. The repository's Pages source must be set to **GitHub Actions**. The expected URL is `https://yokiesssmwa0.github.io/Portfolio/`.