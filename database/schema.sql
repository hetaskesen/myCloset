CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  category    TEXT NOT NULL CHECK (category IN ('tops','bottoms','dresses','outerwear','shoes','accessories','other')),
  brand       TEXT,
  color       TEXT,
  date_acquired DATE,
  notes       TEXT,
  photo_url   TEXT,
  photo_public_id TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS outfits (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS outfit_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outfit_id   UUID NOT NULL REFERENCES outfits(id) ON DELETE CASCADE,
  item_id     UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  UNIQUE (outfit_id, item_id)
);

CREATE TABLE IF NOT EXISTS outfit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outfit_id   UUID REFERENCES outfits(id) ON DELETE SET NULL,
  worn_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (worn_date)
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint          TEXT NOT NULL UNIQUE,
  subscription_json JSONB NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outfit_logs_date ON outfit_logs (worn_date DESC);
CREATE INDEX IF NOT EXISTS idx_outfit_items_outfit ON outfit_items (outfit_id);
CREATE INDEX IF NOT EXISTS idx_outfit_items_item ON outfit_items (item_id);
CREATE INDEX IF NOT EXISTS idx_items_category ON items (category);
