-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS webhook_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS webhook_secret TEXT;

-- Create index on webhook_token for faster lookups
CREATE INDEX IF NOT EXISTS profiles_webhook_token_idx ON public.profiles(webhook_token);

-- Create webhook_logs table for tracking webhook requests
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  webhook_token TEXT,
  request_method TEXT NOT NULL DEFAULT 'POST',
  request_headers JSONB,
  request_body JSONB,
  response_status INTEGER NOT NULL,
  response_body JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on webhook_logs
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for webhook_logs
CREATE POLICY "Users can view their own webhook logs" ON public.webhook_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert webhook logs" ON public.webhook_logs
  FOR INSERT WITH CHECK (true);

-- Update RLS policies for profiles to allow trigger function
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "System can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (true);

-- Function to generate webhook token
CREATE OR REPLACE FUNCTION generate_webhook_token()
RETURNS TEXT AS $$
BEGIN
  RETURN 'wh_' || encode(gen_random_bytes(16), 'hex') || '_' || extract(epoch from now())::bigint;
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  user_name TEXT;
BEGIN
  -- Extract email from new user
  user_email := NEW.email;
  
  -- Extract name from raw_user_meta_data or use email
  user_name := COALESCE(
    NEW.raw_user_meta_data ->> 'name',
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'first_name',
    split_part(user_email, '@', 1)
  );

  -- Insert profile with webhook token
  INSERT INTO public.profiles (id, name, email, webhook_token, created_at, updated_at)
  VALUES (
    NEW.id,
    user_name,
    user_email,
    generate_webhook_token(),
    NOW(),
    NOW()
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at on profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add webhook tokens to existing users who don't have them
UPDATE public.profiles 
SET webhook_token = generate_webhook_token(),
    updated_at = NOW()
WHERE webhook_token IS NULL;

-- Ensure all existing users have email in profiles
UPDATE public.profiles 
SET email = auth_users.email,
    updated_at = NOW()
FROM auth.users auth_users
WHERE profiles.id = auth_users.id 
AND (profiles.email IS NULL OR profiles.email = '');
