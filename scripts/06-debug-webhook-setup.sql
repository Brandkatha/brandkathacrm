-- Debug script to check webhook setup
-- Run this to verify your database is properly configured

-- Check if tables exist
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('leads', 'webhook_requests', 'profiles');

-- Check if leads table has correct structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'leads' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if webhook_requests table has correct structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'webhook_requests' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('leads', 'webhook_requests', 'profiles');

-- Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('leads', 'webhook_requests', 'profiles');

-- Test data insertion (this should work with service role)
-- INSERT INTO leads (user_id, name, email, source, status) 
-- VALUES ('test-user-id', 'Test Lead', 'test@example.com', 'test', 'new');

-- Check recent webhook requests
SELECT 
  id,
  user_id,
  webhook_type,
  request_method,
  response_status,
  processed_successfully,
  error_message,
  created_at
FROM webhook_requests 
ORDER BY created_at DESC 
LIMIT 10;

-- Check recent leads
SELECT 
  id,
  user_id,
  name,
  email,
  phone,
  source,
  status,
  created_at
FROM leads 
ORDER BY created_at DESC 
LIMIT 10;
