-- Create a storage bucket for ML models
INSERT INTO storage.buckets (id, name, public)
VALUES ('ml-models', 'ml-models', false);

-- Allow authenticated users to read models (for edge functions, service role bypasses RLS)
CREATE POLICY "Service role can access models"
ON storage.objects
FOR ALL
USING (bucket_id = 'ml-models')
WITH CHECK (bucket_id = 'ml-models');