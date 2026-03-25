-- Migration: 20260326_create_exchange_rates_table
-- Description: Create exchange_rates table to store currency conversion rates to VND
-- Author: Antigravity
-- Date: 2026-03-26

-- ============================================================
-- UP
-- ============================================================
CREATE TABLE IF NOT EXISTS exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  currency_code text UNIQUE NOT NULL,
  rate numeric(18, 4) NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Bật RLS
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- Tạo policy cho authenticated users (để server-side bypass RLS dùng service role, 
-- hoặc nếu frontend gọi trực tiếp thì cần policy này. agent.md nói backend dùng service role)
-- Tuy nhiên vẫn nên có policy cơ bản.
CREATE POLICY "Allow all for authenticated users" ON exchange_rates
  FOR ALL TO authenticated USING (true);

-- Insert default value
INSERT INTO exchange_rates (currency_code, rate) 
VALUES ('USD', 26283.0000)
ON CONFLICT (currency_code) DO NOTHING;

-- ============================================================
-- DOWN (rollback)
-- ============================================================
-- DROP TABLE IF EXISTS exchange_rates;
