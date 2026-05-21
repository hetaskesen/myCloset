# 🪡 My Closet

A personal wardrobe tracker — log what you wear daily, track item frequency, build outfits, and get daily push notifications. Installable as a PWA on phone or desktop.

---

## How it works

One server does everything. Express serves the API and, in production, serves the built React app as static files. In development, Vite runs its own fast dev server and proxies API calls to Express automatically.

```
Dev:   Browser → Vite (5173) → proxies /api → Express (3001) → PostgreSQL
Prod:  Browser → Express (single port) → PostgreSQL
```

---

## Running locally (quickest start)

### Prerequisites
- Node.js 18+
- PostgreSQL (installed below)

### Setup

```bash
git clone https://github.com/YOUR_USERNAME/my-closet.git
cd my-closet
chmod +x setup-local.sh
./setup-local.sh
```

The script will:
- Install dependencies
- Install PostgreSQL if needed
- Create a local database
- Generate a random API secret in `.env`
- Run the schema

Then start the app:
```bash
npm run dev
```

Open **http://localhost:5173** — that's it.

---

## Manual local setup (if the script doesn't work)

```bash
# Install dependencies
npm install

# Install and start PostgreSQL
sudo apt update && sudo apt install -y postgresql
sudo systemctl start postgresql

# Create the database
sudo -u postgres psql -c "CREATE DATABASE mycloset;"
sudo -u postgres psql -c "CREATE USER mycloset_user WITH PASSWORD 'mycloset';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE mycloset TO mycloset_user;"

# Set up your .env
cp .env.example .env
# Edit .env — set DATABASE_URL to:
# postgresql://mycloset_user:mycloset@localhost:5432/mycloset

# Run the schema
psql "postgresql://mycloset_user:mycloset@localhost:5432/mycloset" -f database/schema.sql

# Start
npm run dev
```

---

## Deploying to Render (free, always online)

When you're ready to go online, Render is the easiest free option.

### 1. Create a PostgreSQL database on Render
- render.com → New → PostgreSQL → free tier → Create
- Copy the **External Database URL**

### 2. Run the schema on Render's database
```bash
psql "YOUR_RENDER_DATABASE_URL" -f database/schema.sql
```

### 3. Deploy the app
- Render → New → Web Service → connect your GitHub repo
- **Build command:** `npm install && npm run build`
- **Start command:** `npm start`
- **Environment:** Node

### 4. Add environment variables in Render dashboard

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Your Render PostgreSQL URL |
| `API_SECRET` | Run: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `CLOUDINARY_CLOUD_NAME` | From cloudinary.com (free account) |
| `CLOUDINARY_API_KEY` | From cloudinary.com |
| `CLOUDINARY_API_SECRET` | From cloudinary.com |
| `VAPID_PUBLIC_KEY` | Run: `npx web-push generate-vapid-keys` |
| `VAPID_PRIVATE_KEY` | From the same command |
| `VAPID_EMAIL` | `mailto:you@example.com` |

### 5. Update your frontend API secret
Once deployed, set `VITE_API_SECRET` in Render to match your `API_SECRET` — wait, in this single-server setup there's no separate frontend deploy. The secret is only used server-side. ✓

Your app will be live at `https://your-app.onrender.com`.

> **Note:** Render's free tier spins down after 15 min of inactivity. First load after sleep takes ~30 seconds. Your data is always safe — only the server sleeps, not the database.

---

## Setting up photo uploads (Cloudinary)

1. Sign up free at [cloudinary.com](https://cloudinary.com)
2. Dashboard shows **Cloud Name**, **API Key**, **API Secret**
3. Add to your `.env` (local) or Render environment variables (production)

Without Cloudinary configured, the app still works — items just won't have photos.

---

## Setting up daily notifications

### Locally (Linux cron)
```bash
crontab -e
# Add (sends notification at 8pm every day):
0 20 * * * curl -s -X POST http://localhost:3001/api/notifications/send-daily -H "x-api-secret: YOUR_SECRET"
```

### On Render
Use Render's **Cron Jobs** feature (free tier available) with:
```
0 20 * * *
curl -X POST https://your-app.onrender.com/api/notifications/send-daily -H "x-api-secret: YOUR_SECRET"
```

---

## Environment variables

Copy `.env.example` to `.env` and fill in:

```bash
NODE_ENV=development
PORT=3001
API_SECRET=           # random hex string
DATABASE_URL=         # postgresql://...
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_EMAIL=mailto:you@example.com
```

---

## Scripts

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start both Express + Vite dev servers |
| `npm run build` | Build React into `dist/` |
| `npm start` | Run Express in production (serves built React) |
| `./setup-local.sh` | First-time local setup |

---

## License

MIT
