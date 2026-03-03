-- =============================================================
-- 1. Create enum types for equipment_type and equipment_status
-- =============================================================

CREATE TYPE public.equipment_type AS ENUM (
  'camara',
  'lente',
  'iluminacion',
  'tramoya',
  'audio',
  'video',
  'estudio',
  'otros_accesorios'
);

CREATE TYPE public.equipment_status AS ENUM (
  'disponible',
  'mantenimiento',
  'no_disponible'
);

-- =============================================================
-- 2. Drop column DEFAULTs before altering types
--    (Postgres cannot auto-cast a DEFAULT to a new enum type)
-- =============================================================

ALTER TABLE public.equipment ALTER COLUMN type   DROP DEFAULT;
ALTER TABLE public.equipment ALTER COLUMN status DROP DEFAULT;

-- =============================================================
-- 3. Drop the old CHECK constraint on status
-- =============================================================

ALTER TABLE public.equipment DROP CONSTRAINT IF EXISTS equipment_status_check;

-- =============================================================
-- 4. Normalise existing TEXT data to enum-compatible values
-- =============================================================

-- type column: map any free-text that matches common patterns
UPDATE public.equipment SET type = 'camara'           WHERE lower(type) ILIKE '%cam%';
UPDATE public.equipment SET type = 'iluminacion'      WHERE lower(type) ILIKE '%luz%'
                                                         OR lower(type) ILIKE '%ilum%'
                                                         OR lower(type) ILIKE '%light%';
-- Fall through: anything still not a valid enum value → otros_accesorios
UPDATE public.equipment
  SET type = 'otros_accesorios'
  WHERE type NOT IN ('camara','lente','iluminacion','tramoya','audio','video','estudio','otros_accesorios');

-- status column: map English legacy values to Spanish enum values
UPDATE public.equipment SET status = 'disponible'    WHERE status IN ('available',    'disponible');
UPDATE public.equipment SET status = 'mantenimiento'  WHERE status IN ('maintenance',  'mantenimiento');
UPDATE public.equipment SET status = 'no_disponible'  WHERE status IN ('retired',      'no_disponible');

-- =============================================================
-- 5. Alter columns to use the new enum types
-- =============================================================

ALTER TABLE public.equipment
  ALTER COLUMN type   TYPE public.equipment_type   USING type::public.equipment_type,
  ALTER COLUMN status TYPE public.equipment_status USING status::public.equipment_status;

-- =============================================================
-- 6. Restore sensible DEFAULTs using the enum type
-- =============================================================

ALTER TABLE public.equipment ALTER COLUMN type   SET DEFAULT 'otros_accesorios'::public.equipment_type;
ALTER TABLE public.equipment ALTER COLUMN status SET DEFAULT 'disponible'::public.equipment_status;

-- =============================================================
-- 7. Add image_url column
-- =============================================================

ALTER TABLE public.equipment
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- =============================================================
-- 8. Create Supabase Storage bucket for equipment images
-- =============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'equipment-images',
  'equipment-images',
  TRUE,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "Authenticated users can upload equipment images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'equipment-images');

CREATE POLICY "Equipment images are publicly readable"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'equipment-images');

CREATE POLICY "Authenticated users can update own equipment images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'equipment-images');

CREATE POLICY "Authenticated users can delete own equipment images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'equipment-images');
