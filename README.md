# Baby Log

A mobile-first web app for tracking wet diapers, dirty diapers, and breastfeeding sessions. Built for tired parents at 3am — big buttons, calm colors, and minimal friction.

## Tech Stack

- **Next.js** (App Router) + **TypeScript**
- **Tailwind CSS**
- **Supabase** (database)
- **Vercel** (hosting)

## Features

- **Wet / Dirty Diaper** — log now or enter an earlier time
- **Feed** — start a live timer or enter a completed session manually
- **Active feeding** — one session at a time with on-screen timer, pause/resume for burp breaks, and End Feeding
- **Last fed** — shows time since the last feeding ended
- **Baby Log** — view, edit, and delete all entries (newest first)

---

## Install

```bash
npm install
```

## Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New Project**
3. Choose an organization, name, database password, and region
4. Wait for the project to finish provisioning

## Run the SQL Schema

1. In your Supabase dashboard, open **SQL Editor**
2. Click **New query**
3. Copy the contents of `supabase/schema.sql` and paste into the editor
4. Click **Run**
5. Confirm success — you should see the `baby_events` table under **Table Editor**

If you already ran an earlier version of the schema, also run:
- `supabase/migrations/001_add_feed_pause.sql` — pause support
- `supabase/migrations/002_add_bottle_feed.sql` — bottle feeding option
- `supabase/migrations/003_add_bottle_type.sql` — breast milk or formula for bottles

## Add Environment Variables

1. Copy the example env file:

   ```bash
   cp .env.example .env.local
   ```

2. In Supabase, go to **Project Settings → API**
3. Copy these values into `.env.local`:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

> **Note:** The MVP uses open RLS policies so the app works without auth. When you add Supabase Auth later, update RLS to scope rows by `user_id`.

## Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) on your phone or browser.

### Add to Home Screen (iPhone)

1. Open the app in Safari
2. Tap **Share → Add to Home Screen**
3. The app runs fullscreen like a native app

---

## Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) and import the repository
3. Add environment variables in **Project Settings → Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

Vercel will build and deploy automatically on every push.

---

## Project Structure

```
app/
  page.tsx          # Dashboard
  log/page.tsx      # Baby Log
components/
  ActionButton.tsx
  EventModal.tsx
  FeedModal.tsx
  ActiveFeedCard.tsx
  LogItem.tsx
  EditEventModal.tsx
lib/
  supabaseClient.ts
  babyEvents.ts
  dateUtils.ts
types/
  babyEvent.ts
supabase/
  schema.sql
```

## Database: `baby_events`

| Column            | Type        | Notes                                      |
|-------------------|-------------|--------------------------------------------|
| id                | uuid        | Primary key                                |
| user_id           | uuid        | Nullable — ready for auth                  |
| baby_id           | uuid        | Nullable — ready for multiple babies       |
| event_type        | text        | `wet_diaper`, `dirty_diaper`, `feed`       |
| occurred_at       | timestamptz | Diaper time, or feed start for feeds       |
| feed_side         | text        | `left`, `right`, or `bottle` (feeds only)  |
| bottle_type       | text        | `breast_milk` or `formula` (bottle only)   |
| feed_start_time   | timestamptz | Feed start                                 |
| feed_end_time     | timestamptz | Feed end (null while active)               |
| feed_paused_at    | timestamptz | When currently paused (null while running)   |
| feed_paused_seconds | integer   | Accumulated pause time in seconds            |
| duration_minutes  | integer     | Active feeding time (excludes pauses)      |
| notes             | text        | Optional                                   |
| created_at        | timestamptz | Auto                                       |
| updated_at        | timestamptz | Auto                                       |

Timestamps are stored in UTC and displayed in the user's local timezone.

## Adding Auth Later

The app is structured for easy auth integration:

1. Enable Supabase Auth (email, magic link, etc.)
2. Pass the authenticated user's ID when creating events (`user_id`)
3. Replace open RLS policies in `supabase/schema.sql` with `auth.uid() = user_id`
4. Optionally add a login page and protect routes

No major refactor needed — the Supabase client and data layer are already centralized in `lib/`.

---

## License

MIT
