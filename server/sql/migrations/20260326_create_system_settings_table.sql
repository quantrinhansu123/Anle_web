-- Migration: 20260326_create_system_settings_table
-- Description: Table to store company profile and system configuration
-- Author: Antigravity AI
-- Date: 2026-03-26

-- ============================================================
-- UP
-- ============================================================

CREATE TABLE IF NOT EXISTS system_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name text NOT NULL,
  representative text,
  tax_code text,
  address text,
  logo_url text,
  phone text,
  email text,
  website text,
  facebook text,
  community_group text,
  zalo text,
  tiktok text,
  tech_support_name text,
  tech_support_role text,
  tech_support_phone text,
  tech_support_email text,
  business_support_name text,
  business_support_role text,
  business_support_phone text,
  business_support_email text,
  version text DEFAULT '2.4.0',
  license_date date DEFAULT '2024-01-01',
  created_at timestamp WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for CopyrightPage and potentially branding)
DROP POLICY IF EXISTS "Allow public read system_settings" ON system_settings;
CREATE POLICY "Allow public read system_settings" ON system_settings FOR SELECT USING (true);

-- Allow authenticated users to manage the settings
DROP POLICY IF EXISTS "Allow all for authenticated users" ON system_settings;
CREATE POLICY "Allow all for authenticated users" ON system_settings FOR ALL USING (auth.role() = 'authenticated');

-- Initial Data
INSERT INTO system_settings (
  company_name,
  representative,
  tax_code,
  address,
  phone,
  email,
  website,
  facebook,
  community_group,
  zalo,
  tiktok,
  tech_support_name,
  tech_support_role,
  tech_support_phone,
  tech_support_email,
  business_support_name,
  business_support_role,
  business_support_phone,
  business_support_email,
  version,
  license_date
) VALUES (
  'ANLE LOGISTICS TECHNOLOGY SOLUTIONS LTD.',
  'Mr. An Le',
  '0123456789',
  'Innovation Building, Ben Nghe Ward, District 1, Ho Chi Minh City, Vietnam',
  '+84 123 456 789',
  'contact@anlelogistics.com',
  'https://anlelogistics.com',
  'https://facebook.com/anlelogistics',
  'https://facebook.com/groups/anlecommunity',
  'https://zalo.me/anlegroup',
  'https://tiktok.com/@anlelogistics',
  'Mr. Tech Support',
  'Head of Technology',
  '+84 901 234 567',
  'support@anlelogistics.com',
  'Ms. Business Sales',
  'Sales Director',
  '+84 909 876 543',
  'sales@anlelogistics.com',
  'v2.4.0 (Stable)',
  '2024-01-01'
) ON CONFLICT DO NOTHING;

-- ============================================================
-- DOWN (rollback)
-- ============================================================
-- DROP TABLE IF EXISTS system_settings;
