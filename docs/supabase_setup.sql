-- ==========================================
-- SUPABASE DATABASE & STORAGE SETUP SCRIPT
-- TABLA Y BUCKET DE ASISTENTES 3D (GLTF)
-- ==========================================

-- 1. Crear tabla 'assistants' para almacenar los modelos GLTF y sus configuraciones
CREATE TABLE IF NOT EXISTS public.assistants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    gltf_url TEXT NOT NULL,
    poster_url TEXT,
    voice_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habilitar RLS (Row Level Security) en la tabla 'assistants'
ALTER TABLE public.assistants ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de acceso público para la tabla 'assistants'
DROP POLICY IF EXISTS "Permitir lectura publica de asistentes" ON public.assistants;
CREATE POLICY "Permitir lectura publica de asistentes"
ON public.assistants FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Permitir insercion publica de asistentes" ON public.assistants;
CREATE POLICY "Permitir insercion publica de asistentes"
ON public.assistants FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir eliminacion publica de asistentes" ON public.assistants;
CREATE POLICY "Permitir eliminacion publica de asistentes"
ON public.assistants FOR DELETE
USING (true);

DROP POLICY IF EXISTS "Permitir actualizacion publica de asistentes" ON public.assistants;
CREATE POLICY "Permitir actualizacion publica de asistentes"
ON public.assistants FOR UPDATE
USING (true);

-- 4. Crear el bucket de almacenamiento 'assistants' en Supabase Storage
-- Nota: En la consola de Supabase, ve a Storage -> New Bucket -> Nombre: 'assistants' y marcalo como "Public".
-- O si ejecutas con permisos de administrador en SQL Editor:
INSERT INTO storage.buckets (id, name, public)
VALUES ('assistants', 'assistants', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Politicas RLS para el Bucket 'assistants' en Storage
DROP POLICY IF EXISTS "Acceso publico lectura de archivos asistentes" ON storage.objects;
CREATE POLICY "Acceso publico lectura de archivos asistentes"
ON storage.objects FOR SELECT
USING (bucket_id = 'assistants');

DROP POLICY IF EXISTS "Acceso publico subida de archivos asistentes" ON storage.objects;
CREATE POLICY "Acceso publico subida de archivos asistentes"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'assistants');

DROP POLICY IF EXISTS "Acceso publico eliminacion de archivos asistentes" ON storage.objects;
CREATE POLICY "Acceso publico eliminacion de archivos asistentes"
ON storage.objects FOR DELETE
USING (bucket_id = 'assistants');

-- 6. Insertar asistente por defecto si la tabla está vacía
INSERT INTO public.assistants (name, gltf_url, poster_url, voice_id)
SELECT 'Asistente Principal', './assets/img/ia.gltf', './assets/img/logopwa.png', ''
WHERE NOT EXISTS (SELECT 1 FROM public.assistants);
