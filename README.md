# Kana Path

Kana Path is an Expo app for learning hiragana and katakana from the beginning. It builds a daily plan around the learner’s available study time, then adjusts the completion estimate as practice results come in.

## Run the app

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go, or press `w` in the Expo terminal to open the web version. The local Supabase URL and publishable key are already in the ignored `.env.local` file.

## Learning features

- A guided path from basic sound rows to voiced kana, blends, longer words, and mixed-script fluency
- Reading cards with Japanese audio, self-checks, spaced review, and progress by sound
- A freehand writing canvas with smoothed strokes, a faint guide, and finger or stylus input
- Searchable kana charts, longer word challenges, daily streaks, and an adaptive finish estimate
- Local progress storage with Supabase sync and restore

## Cloud services

The Supabase project `kana-path` is provisioned in Mumbai (`ap-south-1`). Its schema is in `supabase/migrations/`, and the `practice-coach` Edge Function provides short, personalized study nudges using Gemini. Store `GEMINI_API_KEY` as a Supabase function secret; never put it in an `EXPO_PUBLIC_` variable or commit `.env.local` or `supabase/functions/.env`.

After adding your Gemini key, set it on the linked Supabase project with `supabase secrets set GEMINI_API_KEY=your-key --project-ref amguklanangicorojrbc`, then redeploy the function. The function uses `gemini-3.8-flash` by default; override it with a `GEMINI_MODEL` function secret when needed.

Apply later migrations and redeploy the function with:

```bash
supabase db push
supabase functions deploy practice-coach --use-api
```
# Accounts, reminders, and app icons

The app uses Supabase Auth for email/password accounts and Google OAuth. Guest progress can be upgraded to an email account without changing the current learner ID. For Google sign-in, enable Google under Supabase **Authentication → Providers**, configure its Web OAuth client ID and secret, and allow the redirect `kanapath://google-auth` in the Supabase redirect URL list. The app's OAuth callback scheme is already configured in `app.json`.

The Android launcher icon uses the Kana Path fox artwork. It changes to the streak fox after a study day and to the celebratory fox at seven active days; Android applies the selected icon when the app moves to the background.

Daily reminders are opt-in. The app schedules an on-device reminder and, on Android, registers the Firebase device token in `public.push_devices`. Apply the migration before expecting cloud push delivery. The `daily-study-nudges` Supabase Edge Function sends FCM HTTP v1 messages when a scheduler calls it with the `x-cron-secret` header. Configure these server-side secrets before deploying it: `SUPABASE_SERVICE_ROLE_KEY`, `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, and `PUSH_CRON_SECRET`. Schedule it every five minutes so it can send each reminder after the learner's chosen local time while skipping days with recent study activity.
