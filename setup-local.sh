#!/bin/bash
# setup-local.sh — Run this once to get My Closet running locally
set -e

echo "🪡 Setting up My Closet..."

# 1. Check for Node
if ! command -v node &>/dev/null; then
  echo "❌ Node.js not found. Install it: https://nodejs.org"
  exit 1
fi

# 2. Check for PostgreSQL
if ! command -v psql &>/dev/null; then
  echo "📦 Installing PostgreSQL client..."
  sudo apt update && sudo apt install -y postgresql postgresql-client
fi

# 3. Install dependencies
echo "📦 Installing dependencies..."
npm install

# 4. Copy env file if not exists
if [ ! -f .env ]; then
  cp .env.example .env
  # Generate a random API secret
  SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
  sed -i "s/your_random_secret_here/$SECRET/" .env
  echo "✓ Created .env with random API_SECRET"
fi

# 5. Create local PostgreSQL database
echo "🗄️  Setting up local database..."
if ! sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw mycloset; then
  sudo -u postgres psql -c "CREATE DATABASE mycloset;"
  sudo -u postgres psql -c "CREATE USER mycloset_user WITH PASSWORD 'mycloset';"
  sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE mycloset TO mycloset_user;"
  # Update .env with local DB URL
  sed -i "s|postgresql://postgres:postgres@localhost:5432/mycloset|postgresql://mycloset_user:mycloset@localhost:5432/mycloset|" .env
  echo "✓ Database created"
fi

# 6. Run schema
echo "📋 Running database schema..."
source .env 2>/dev/null || true
psql "$DATABASE_URL" -f database/schema.sql
echo "✓ Tables created"

echo ""
echo "✅ Setup complete!"
echo ""
echo "Start the app with:"
echo "  npm run dev"
echo ""
echo "Then open: http://localhost:5173"
