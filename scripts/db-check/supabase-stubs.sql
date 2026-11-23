-- สำหรับทดสอบเท่านั้น — อย่ารันบน Supabase จริง
-- image supabase/postgres มี auth / storage แค่โครงเริ่มต้น ส่วนที่เหลือ GoTrue
-- กับ storage-api สร้างตอนรันจริง ไฟล์นี้เติมเฉพาะส่วนที่ migrations + seed ใช้

ALTER TABLE auth.users
  ADD COLUMN IF NOT EXISTS email_confirmed_at         timestamptz,
  ADD COLUMN IF NOT EXISTS raw_app_meta_data          jsonb,
  ADD COLUMN IF NOT EXISTS raw_user_meta_data         jsonb,
  ADD COLUMN IF NOT EXISTS confirmation_token         text,
  ADD COLUMN IF NOT EXISTS recovery_token             text,
  ADD COLUMN IF NOT EXISTS email_change               text,
  ADD COLUMN IF NOT EXISTS email_change_token_current text,
  ADD COLUMN IF NOT EXISTS email_change_token_new     text,
  ADD COLUMN IF NOT EXISTS phone_change               text,
  ADD COLUMN IF NOT EXISTS phone_change_token         text,
  ADD COLUMN IF NOT EXISTS reauthentication_token     text,
  ADD COLUMN IF NOT EXISTS phone                      text;

CREATE TABLE IF NOT EXISTS auth.identities (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id     text NOT NULL,
  provider        text NOT NULL,
  identity_data   jsonb NOT NULL,
  last_sign_in_at timestamptz,
  created_at      timestamptz,
  updated_at      timestamptz
);

CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$
  SELECT coalesce(
    nullif(current_setting('request.jwt.claim', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')
  )::jsonb
$$;

ALTER TABLE storage.buckets
  ADD COLUMN IF NOT EXISTS public             boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS file_size_limit    bigint,
  ADD COLUMN IF NOT EXISTS allowed_mime_types text[];

-- SQL Editor ของ Supabase รันเป็น postgres ซึ่งเขียน auth.identities ได้
GRANT ALL ON auth.identities TO postgres;
