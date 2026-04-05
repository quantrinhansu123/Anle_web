import { Request, Response } from 'express';
import { uploadService } from './upload.service';
import sharp from 'sharp';
import { env } from '../../config/env';

export const uploadController = {
  async uploadAvatar(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      const file = req.file;
      let buffer = file.buffer;
      let mimetype = file.mimetype;
      let fileName = `${Date.now()}-${file.originalname}`;

      if (mimetype.startsWith('image/')) {
        buffer = await sharp(file.buffer)
          .resize({ width: 1000, height: 1000, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();
        mimetype = 'image/webp';
        const lastDot = fileName.lastIndexOf('.');
        fileName = (lastDot !== -1 ? fileName.substring(0, lastDot) : fileName) + '.webp';
      }

      const bucket = 'avatars';
      const path = fileName;

      const uploadedPath = await uploadService.uploadFile(
        bucket,
        path,
        buffer,
        mimetype
      );

      const origin = req.headers.origin || `${req.protocol}://${req.get('host')}`;
      const publicUrl = `${origin}/${bucket}/${uploadedPath}`;

      return res.status(200).json({ 
        success: true, 
        message: 'Avatar uploaded successfully',
        data: { url: publicUrl } 
      });
    } catch (err: any) {
      return res.status(500).json({ 
        success: false, 
        message: err.message 
      });
    }
  },

  async uploadGenericFile(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      const file = req.file;
      let buffer = file.buffer;
      let mimetype = file.mimetype;
      let fileName = `${Date.now()}-${file.originalname}`;

      if (mimetype.startsWith('image/')) {
        buffer = await sharp(file.buffer)
          .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();
        mimetype = 'image/webp';
        const lastDot = fileName.lastIndexOf('.');
        fileName = (lastDot !== -1 ? fileName.substring(0, lastDot) : fileName) + '.webp';
      }

      // Use 'uploads' as the default bucket for generic files
      const bucket = 'uploads';
      const path = fileName;

      const uploadedPath = await uploadService.uploadFile(
        bucket,
        path,
        buffer,
        mimetype
      );

      const origin = req.headers.origin || `${req.protocol}://${req.get('host')}`;
      const publicUrl = `${origin}/${bucket}/${uploadedPath}`;

      return res.status(200).json({ 
        success: true, 
        message: 'File uploaded successfully',
        data: { url: publicUrl } 
      });
    } catch (err: any) {
      return res.status(500).json({ 
        success: false, 
        message: err.message 
      });
    }
  },

  async listFiles(req: Request, res: Response) {
    try {
      const bucket = 'uploads'; // We can make this dynamic if needed via query params
      const files = await uploadService.listFiles(bucket);

      const origin = req.headers.origin || `${req.protocol}://${req.get('host')}`;
      const baseUrl = `${origin}/${bucket}`;

      const filesWithUrl = files.map(f => ({
        ...f,
        url: `${baseUrl}/${f.name}`
      }));

      return res.status(200).json({
        success: true,
        data: filesWithUrl
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message
      });
    }
  },

  async serveFile(req: Request, res: Response) {
    try {
      const { bucket, path } = req.params;
      
      const fileUrl = `${env.SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
      
      // Cache the redirect globally for 1 year to skip Vercel checks entirely for repeat visits
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.redirect(302, fileUrl);
    } catch (err: any) {
      return res.status(404).send('File not found');
    }
  },

  async deleteFile(req: Request, res: Response) {
    try {
      const { bucket, path } = req.params;
      
      // Default to uploads if bucket is not provided in a multi-use route
      const actualBucket = bucket || 'uploads';
      
      await uploadService.deleteFile(actualBucket, path);

      return res.status(200).json({
        success: true,
        message: 'File deleted successfully'
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message
      });
    }
  }
};
