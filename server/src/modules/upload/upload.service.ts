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

    return path;
  },

  async getFileBuffer(bucket: string, path: string) {
    const { data, error } = await supabase.storage.from(bucket).download(path);
    if (error) throw new Error(error.message);
    if (!data) throw new Error('File not found');

    const buffer = Buffer.from(await data.arrayBuffer());
    return {
      buffer,
      mimetype: data.type
    };
  },

  async listFiles(bucket: string) {
    const { data: files, error } = await supabase.storage.from(bucket).list('', {
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' }
    });

    if (error) {
      throw new Error(`Failed to list files: ${error.message}`);
    }

    if (!files) return [];

    // Filter out potential system/hidden files like .emptyFolderPlaceholder
    const validFiles = files.filter(f => f.name !== '.emptyFolderPlaceholder');

    return validFiles.map(file => ({
      name: file.name,
      created_at: file.created_at,
      size: file.metadata?.size || 0,
      mimetype: file.metadata?.mimetype || 'image/jpeg'
    }));
  }
};
