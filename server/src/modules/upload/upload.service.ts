import { supabase } from '../../config/supabase';

export const uploadService = {
  async uploadFile(bucket: string, path: string, file: Buffer, contentType: string) {
    // Basic check to ensure bucket and public access
    // In production, this might be handled by an init script
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.find(b => b.id === bucket)) {
      await supabase.storage.createBucket(bucket, {
        public: true,
      });
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        contentType,
        upsert: true,
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    const { data: result } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    console.log('getPublicUrl result:', result);

    if (!result?.publicUrl) {
      throw new Error('Failed to get public URL for the uploaded file');
    }

    return result.publicUrl;
  },
};
