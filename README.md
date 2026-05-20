# 🪡 My Closet

A personal wardrobe tracker — log what you wear daily, track item frequency, build outfits, and get daily push notifications. Built as a PWA (installable on phone or desktop like a real app).

**Live demo:** `https://YOUR_USERNAME.github.io/my-closet`

---

## Features

- 👕 Add clothing items with photos, brand, color, and date acquired
- 🪄 Build and save outfit combinations from your items
- 📅 Daily log — record what you wore each day
- 📊 Insights — wear frequency charts, never-worn alerts, streaks
- 🔔 Push notifications (works as an installed PWA app)
- 📱 Installable on Android, iPhone, and desktop

---

## Tech stack

| Layer | Service | Cost |
|-------|---------|------|
| Frontend | GitHub Pages | Free |
| Backend API | Railway | Free ($5/mo credit) |
| Database | Railway PostgreSQL | Free (included) |
| Photos | Cloudinary | Free (25GB) |
| Notifications | Web Push API | Free (built-in) |

---

## Setup guide

### Prerequisites

- A [GitHub](https://github.com) account
- A [Railway](https://railway.app) account (sign in with GitHub)
- A [Cloudinary](https://cloudinary.com) account (free)
- Node.js 18+ installed locally
- (Optional) [DBeaver](https://dbeaver.io) to browse your database visually

---

### Step 1 — Fork & clone the repo

```bash
# Fork this repo on GitHub, then:
git clone https://github.com/YOUR_USERNAME/my-closet.git
cd my-closet
```

---

### Step 2 — Set up Railway (backend + database)

1. Go to [railway.app](https://railway.app) and create a new project
2. Click **"Add a service" → "Database" → "PostgreSQL"**
3. Click **"Add a service" → "GitHub repo"** → select your fork → set the **Root Directory** to `backend`
4. In the backend service, go to **Variables** and add:

```
API_SECRET=        # generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
DATABASE_URL=      # copy from your PostgreSQL service → Variables → DATABASE_URL
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
VAPID_PUBLIC_KEY=  # see Step 4
VAPID_PRIVATE_KEY= # see Step 4
VAPID_EMAIL=mailto:you@example.com
FRONTEND_URL=https://YOUR_USERNAME.github.io
```

5. In the backend service, go to **Settings → Networking** and click **"Generate Domain"**. Copy this URL — it will look like `https://my-closet-production.railway.app`

---

### Step 3 — Run the database schema

You have two options:

**Option A — Using DBeaver (recommended)**
1. In Railway, go to your PostgreSQL service → **Connect** → copy the **Public connection string**
2. Open DBeaver → New Connection → PostgreSQL → paste the connection string
3. Open `database/schema.sql` in DBeaver and run it (press F5)

**Option B — Using psql**
```bash
psql YOUR_DATABASE_URL -f database/schema.sql
```

---

### Step 4 — Generate VAPID keys (for push notifications)

```bash
cd backend
npm install
npx web-push generate-vapid-keys
```

Copy the public and private keys into your Railway backend environment variables.

---

### Step 5 — Set up Cloudinary

1. Sign up at [cloudinary.com](https://cloudinary.com) (free)
2. From your dashboard, copy **Cloud Name**, **API Key**, and **API Secret**
3. Add these to your Railway backend environment variables (Step 2)

---

### Step 6 — Deploy the frontend to GitHub Pages

1. In your GitHub repo, go to **Settings → Secrets and variables → Actions**
2. Add two secrets:
   - `VITE_API_URL` — your Railway backend URL (e.g. `https://my-closet-production.railway.app`)
   - `VITE_API_SECRET` — same `API_SECRET` value you used in Railway
3. Go to **Settings → Pages** → set Source to **"Deploy from a branch"** → select `gh-pages`
4. Push any change to `main` — the GitHub Action will build and deploy automatically

Your app will be live at: `https://YOUR_USERNAME.github.io/my-closet`

> **Important:** In `frontend/vite.config.js`, change `'my-closet'` to match your actual repository name.

---

### Step 7 — Set up daily notifications (Linux/Mac)

The backend exposes a `/notifications/send-daily` endpoint. Call it daily with a cron job:

```bash
# Open crontab
crontab -e

# Add this line to send a notification at 8pm every day:
0 20 * * * curl -s -X POST https://YOUR_BACKEND.railway.app/notifications/send-daily -H "x-api-secret: YOUR_API_SECRET"
```

The notification is only sent if you haven't already logged an outfit that day.

---

### Step 8 — Install as an app

Open your GitHub Pages URL in a browser, then:

- **Android:** Tap ⋮ menu → "Add to Home screen"
- **iPhone:** Tap Share → "Add to Home Screen"
- **Desktop Chrome/Edge:** Click the install icon in the address bar

Go to **Settings** in the app and enable push notifications.

---

## Local development

```bash
# Backend
cd backend
cp .env.example .env   # fill in your values
npm install
npm run dev            # runs on http://localhost:3001

# Frontend (in a new terminal)
cd frontend
cp .env.example .env.local   # fill in your values
npm install
npm run dev            # runs on http://localhost:5173
```

---

## Connecting DBeaver to your Railway database

1. In Railway, go to your PostgreSQL service → **Connect** tab
2. Copy the **Public connection string**
3. In DBeaver: **Database → New Connection → PostgreSQL**
4. Paste the connection string, or fill in host/port/user/password manually
5. Click **Test Connection** → **Finish**

You can now browse all your closet data, run custom queries, and export CSVs.

---

## Environment variables reference

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `API_SECRET` | Random secret shared with the frontend for auth |
| `DATABASE_URL` | PostgreSQL connection string from Railway |
| `CLOUDINARY_CLOUD_NAME` | From Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | From Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | From Cloudinary dashboard |
| `VAPID_PUBLIC_KEY` | Generated with `npx web-push generate-vapid-keys` |
| `VAPID_PRIVATE_KEY` | Generated with `npx web-push generate-vapid-keys` |
| `VAPID_EMAIL` | Your email, prefixed with `mailto:` |
| `FRONTEND_URL` | Your GitHub Pages URL (for CORS) |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Your Railway backend URL |
| `VITE_API_SECRET` | Same as backend `API_SECRET` |

---

## License

MIT — do whatever you like with it.
