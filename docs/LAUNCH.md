# HomeLink Rwanda launch checklist

## 1. Update the database
Run these two files in order before deploying the new code, because the app depends on them:

1. `supabase/migrations/20261102120000_market_ready.sql` (skip it if you have already run it)
2. `supabase/migrations/20261104120000_dashboards.sql`

Back up the database first (Supabase dashboard > Database > Backups), then either run `supabase db push`
or paste the file into the Supabase SQL editor.

## 2. Deploy to Vercel
- Framework preset: Other
- Build command: `npm run build`
- Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_APP_URL`
- Output is written to `.vercel/output`, which Vercel picks up automatically.

## 3. Configure Supabase Auth
In Authentication > URL Configuration, set the Site URL to your domain and add
`https://YOUR-DOMAIN/reset-password` and `https://YOUR-DOMAIN/auth/callback` to the redirect URLs.
Add a custom SMTP provider so confirmation and reset emails are delivered reliably.

## 4. Before going public
- Change the admin password. An old version of the code contained it, and the repository is public.
- Set real rates in Admin > Exchange rates. The starting values are estimates.
- Update `public/robots.txt` if the domain is not homelink.rw.
- Confirm `CONTACT_EMAIL` and the support WhatsApp number in `src/lib/constants.ts`.
- Have a lawyer review `/terms` and `/privacy`.
- Have a native speaker review `src/locales/rw.json`.
- Add real listings first: the home page looks empty until landlords join.
