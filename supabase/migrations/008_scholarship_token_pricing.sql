-- Add payment-token columns to scholarship_applications for the new scholarship flow.
-- These allow admin approval to generate a unique, time-limited payment link.
ALTER TABLE public.scholarship_applications
  ADD COLUMN IF NOT EXISTS payment_token      UUID UNIQUE,
  ADD COLUMN IF NOT EXISTS payment_completed  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS token_expires_at   TIMESTAMP WITH TIME ZONE;

-- Update all course prices to ₦250,000
UPDATE public.courses SET price = 250000 WHERE price != 250000;
