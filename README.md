# Folio Foundry

A responsive portfolio builder with exactly three live-preview designs: Simple, Modern, and Creative. Create, edit, retrieve, and delete portfolios in browser storage, or connect a Supabase project for authenticated online storage.

## Run locally

Open `index.html` in a browser, or serve this folder with any static web server. Local mode works without an account and saves portfolios in the current browser.

## Enable online storage

1. Create a Supabase project and open its SQL Editor.
2. Run [`supabase/schema.sql`](supabase/schema.sql) to create the portfolio table and owner-only row-level security policies.
3. In the app, open **Settings → Online database**. Enter the project's URL and publishable (or legacy anon) key, then create an account or sign in.
4. Use the same project URL and key on another device to retrieve the account's portfolios.

The public browser key is intended for client-side use. Never use a Supabase `service_role` key in this site. Row-level security limits access to each authenticated account. Profile images are resized in the browser and stored with portfolio data.

## Publish

GitHub Actions deploys the static app to GitHub Pages on every push to `main`. The workflow requires the repository's Pages source to use **GitHub Actions**. For this repository the expected URL is:

`https://yokiesssmwa0.github.io/Portfolio/`