-- ==============================================================================
-- VOLTLOOP Community EV Charging Marketplace
-- Supabase PostgreSQL Schema with Row Level Security (RLS) & Triggers
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. PROFILES (Extends auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  phone TEXT,
  role TEXT DEFAULT 'BOTH' CHECK (role IN ('DRIVER', 'HOST', 'BOTH', 'ADMIN')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger to automatically create a profile when a new user signs up via Google or Email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', ''),
    'BOTH'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = timezone('utc'::text, now());
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 2. VEHICLES (User EV Fleet)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  battery_capacity_kwh NUMERIC NOT NULL CHECK (battery_capacity_kwh > 0),
  connector_type TEXT NOT NULL,
  max_ac_charging_kw NUMERIC NOT NULL CHECK (max_ac_charging_kw > 0),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 3. CHARGERS (Community Private Chargers)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chargers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  charger_type TEXT NOT NULL DEFAULT 'AC Wallbox',
  power_kw NUMERIC NOT NULL CHECK (power_kw > 0),
  connector_type TEXT NOT NULL DEFAULT 'Type 2',
  electricity_rate NUMERIC NOT NULL CHECK (electricity_rate >= 0),
  host_fee NUMERIC NOT NULL DEFAULT 35 CHECK (host_fee >= 0),
  platform_fee NUMERIC NOT NULL DEFAULT 12 CHECK (platform_fee >= 0),
  availability_start TIME DEFAULT '19:00',
  availability_end TIME DEFAULT '08:00',
  image_urls TEXT[] DEFAULT '{}',
  verification_status TEXT NOT NULL DEFAULT 'PENDING_REVIEW' CHECK (verification_status IN ('PENDING_REVIEW', 'AI_REVIEWED', 'ACTIVE', 'REJECTED')),
  verification_score NUMERIC DEFAULT 0.0,
  verification_reason TEXT,
  rating NUMERIC DEFAULT 0.0,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 4. BOOKINGS (Overnight Charging Reservations)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_code TEXT NOT NULL UNIQUE,
  charger_id UUID NOT NULL REFERENCES public.chargers(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  initial_soc NUMERIC NOT NULL CHECK (initial_soc >= 0 AND initial_soc <= 100),
  target_soc NUMERIC NOT NULL CHECK (target_soc > initial_soc AND target_soc <= 100),
  estimated_energy_kwh NUMERIC NOT NULL CHECK (estimated_energy_kwh >= 0),
  estimated_charging_time_minutes INTEGER NOT NULL,
  electricity_cost NUMERIC NOT NULL CHECK (electricity_cost >= 0),
  host_fee NUMERIC NOT NULL CHECK (host_fee >= 0),
  platform_fee NUMERIC NOT NULL CHECK (platform_fee >= 0),
  total_cost NUMERIC NOT NULL CHECK (total_cost >= 0),
  status TEXT NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED')),
  payment_method TEXT DEFAULT 'UPI',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 5. REVIEWS (Ratings & Feedback)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
  charger_id UUID NOT NULL REFERENCES public.chargers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chargers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Profiles: Public can view basic host profiles; users can update their own
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Vehicles: Users can CRUD only their own vehicles
CREATE POLICY "Users can view their own vehicles"
  ON public.vehicles FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create vehicles"
  ON public.vehicles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vehicles"
  ON public.vehicles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vehicles"
  ON public.vehicles FOR DELETE USING (auth.uid() = user_id);

-- Chargers: Public can view only ACTIVE chargers; owners can view all their chargers
CREATE POLICY "Public can view ACTIVE chargers"
  ON public.chargers FOR SELECT
  USING (verification_status = 'ACTIVE' OR auth.uid() = owner_id);

CREATE POLICY "Authenticated users can create chargers"
  ON public.chargers FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their chargers"
  ON public.chargers FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their chargers"
  ON public.chargers FOR DELETE USING (auth.uid() = owner_id);

-- Bookings: Users can view their own bookings; hosts can view bookings for their chargers
CREATE POLICY "Users can view their own bookings"
  ON public.bookings FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.chargers WHERE public.chargers.id = bookings.charger_id AND public.chargers.owner_id = auth.uid())
  );

CREATE POLICY "Authenticated users can create bookings"
  ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Participants can update their booking status"
  ON public.bookings FOR UPDATE
  USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.chargers WHERE public.chargers.id = bookings.charger_id AND public.chargers.owner_id = auth.uid())
  );

-- Reviews: Viewable by everyone; insertable only for completed booking by the booking owner
CREATE POLICY "Reviews are viewable by everyone"
  ON public.reviews FOR SELECT USING (true);

CREATE POLICY "Booking owners can review after completion"
  ON public.reviews FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE public.bookings.id = reviews.booking_id
        AND public.bookings.user_id = auth.uid()
        AND public.bookings.status = 'COMPLETED'
    )
  );

-- ------------------------------------------------------------------------------
-- 7. STORAGE BUCKET CONFIGURATION (Run in Supabase SQL Editor / Dashboard)
-- ------------------------------------------------------------------------------
-- Insert storage buckets if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('charger-images', 'charger-images', true),
  ('charger-verification', 'charger-verification', false),
  ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public can view charger-images and profile-images
CREATE POLICY "Public read charger images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'charger-images' OR bucket_id = 'profile-images');

-- Authenticated users can upload to charger-images
CREATE POLICY "Authenticated users can upload charger images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'charger-images' AND auth.role() = 'authenticated');
