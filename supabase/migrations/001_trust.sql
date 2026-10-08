-- =====================================================
-- rod2buy Trust & Security Upgrade
-- Run once in Supabase SQL Editor
-- =====================================================

-- ── 1. profiles: verification + role ─────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS id_verified    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_at    timestamptz,
  ADD COLUMN IF NOT EXISTS role           text NOT NULL DEFAULT 'user'
    CHECK (role IN ('user', 'admin'));

-- ── 2. listings: document + history fields ────────────
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS registration_book_image text,
  ADD COLUMN IF NOT EXISTS chassis_number          text,
  ADD COLUMN IF NOT EXISTS registration_province   text,
  ADD COLUMN IF NOT EXISTS tax_expiry              date,
  ADD COLUMN IF NOT EXISTS num_owners              smallint NOT NULL DEFAULT 1
    CHECK (num_owners BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS finance_status          text NOT NULL DEFAULT 'clear'
    CHECK (finance_status IN ('clear', 'financing', 'paid_off')),
  ADD COLUMN IF NOT EXISTS accident_history        text NOT NULL DEFAULT 'none'
    CHECK (accident_history IN ('none', 'minor', 'major')),
  ADD COLUMN IF NOT EXISTS flood_damage            boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS inspection_report_url   text,
  ADD COLUMN IF NOT EXISTS rejection_reason        text,
  ADD COLUMN IF NOT EXISTS updated_at              timestamptz NOT NULL DEFAULT now();

-- ── 3. updated_at auto-trigger for listings ──────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS listings_set_updated_at ON public.listings;
CREATE TRIGGER listings_set_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 4. audit_logs ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action     text NOT NULL,
  target_id  text,
  ip         text,
  metadata   jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_read_audit_logs"     ON public.audit_logs;
DROP POLICY IF EXISTS "authenticated_insert_audit" ON public.audit_logs;

CREATE POLICY "admin_read_audit_logs" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Server actions insert logs; anon insert blocked by RLS intentionally
-- (use service role key in server actions when logging)
CREATE POLICY "authenticated_insert_audit" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ── 5. verification-docs private bucket ──────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'verification-docs',
  'verification-docs',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Owner can upload their own docs (path: {user_id}/...)
DROP POLICY IF EXISTS "owner_upload_verification_docs" ON storage.objects;
CREATE POLICY "owner_upload_verification_docs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'verification-docs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Owner + admin can read
DROP POLICY IF EXISTS "owner_admin_read_verification_docs" ON storage.objects;
CREATE POLICY "owner_admin_read_verification_docs" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'verification-docs'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
  );

-- Owner can delete their own docs
DROP POLICY IF EXISTS "owner_delete_verification_docs" ON storage.objects;
CREATE POLICY "owner_delete_verification_docs" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'verification-docs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
