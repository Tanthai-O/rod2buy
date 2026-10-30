-- rod2buy seed 1/6 — บัญชีทดสอบ 2 คน
-- รันตามลำดับ 1 → 6 (รันซ้ำได้) · สร้างจาก scripts/seed/generate.mjs

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin') THEN
    RAISE EXCEPTION 'ต้องมีบัญชี admin อย่างน้อย 1 คนก่อนรัน seed (UPDATE profiles SET role = ''admin'' WHERE id = ''<your-user-id>'')';
  END IF;
END;
$$;

-- seller@rod2buy.test
INSERT INTO auth.users
  (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
   raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
   confirmation_token, recovery_token, email_change, email_change_token_new,
   email_change_token_current, phone_change, phone_change_token, reauthentication_token)
SELECT '00000000-0000-0000-0000-000000000000', '5eed0000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'seller@rod2buy.test',
  extensions.crypt('rod2buy-test-1234', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"สมชาย ขายรถ (ทดสอบ)"}', now(), now(),
  '', '', '', '', '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '5eed0000-0000-4000-8000-000000000001' OR email = 'seller@rod2buy.test');

INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
SELECT gen_random_uuid(), '5eed0000-0000-4000-8000-000000000001', '5eed0000-0000-4000-8000-000000000001', 'email',
  jsonb_build_object('sub', '5eed0000-0000-4000-8000-000000000001', 'email', 'seller@rod2buy.test', 'email_verified', true), now(), now(), now()
WHERE EXISTS (SELECT 1 FROM auth.users WHERE id = '5eed0000-0000-4000-8000-000000000001')
  AND NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = '5eed0000-0000-4000-8000-000000000001' AND provider = 'email');

INSERT INTO public.profiles (id, display_name, phone, line_id, id_verified, verified_at)
SELECT '5eed0000-0000-4000-8000-000000000001', 'สมชาย ขายรถ (ทดสอบ)', '0810000001', 'somchai.test', true, now()
WHERE EXISTS (SELECT 1 FROM auth.users WHERE id = '5eed0000-0000-4000-8000-000000000001')
ON CONFLICT (id) DO UPDATE
  SET display_name = EXCLUDED.display_name, phone = EXCLUDED.phone, line_id = EXCLUDED.line_id,
      id_verified = EXCLUDED.id_verified, verified_at = EXCLUDED.verified_at;

-- buyer@rod2buy.test
INSERT INTO auth.users
  (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
   raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
   confirmation_token, recovery_token, email_change, email_change_token_new,
   email_change_token_current, phone_change, phone_change_token, reauthentication_token)
SELECT '00000000-0000-0000-0000-000000000000', '5eed0000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'buyer@rod2buy.test',
  extensions.crypt('rod2buy-test-1234', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"สมหญิง หารถ (ทดสอบ)"}', now(), now(),
  '', '', '', '', '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '5eed0000-0000-4000-8000-000000000002' OR email = 'buyer@rod2buy.test');

INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
SELECT gen_random_uuid(), '5eed0000-0000-4000-8000-000000000002', '5eed0000-0000-4000-8000-000000000002', 'email',
  jsonb_build_object('sub', '5eed0000-0000-4000-8000-000000000002', 'email', 'buyer@rod2buy.test', 'email_verified', true), now(), now(), now()
WHERE EXISTS (SELECT 1 FROM auth.users WHERE id = '5eed0000-0000-4000-8000-000000000002')
  AND NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = '5eed0000-0000-4000-8000-000000000002' AND provider = 'email');

INSERT INTO public.profiles (id, display_name, phone, line_id, id_verified, verified_at)
SELECT '5eed0000-0000-4000-8000-000000000002', 'สมหญิง หารถ (ทดสอบ)', '0810000002', NULL, false, NULL
WHERE EXISTS (SELECT 1 FROM auth.users WHERE id = '5eed0000-0000-4000-8000-000000000002')
ON CONFLICT (id) DO UPDATE
  SET display_name = EXCLUDED.display_name, phone = EXCLUDED.phone, line_id = EXCLUDED.line_id,
      id_verified = EXCLUDED.id_verified, verified_at = EXCLUDED.verified_at;
