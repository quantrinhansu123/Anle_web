import { Request, Response } from 'express';
import { uploadService } from './upload.service';

export const uploadController = {
  async uploadAvatar(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      const file = req.file;
      const fileName = `${Date.now()}-${file.originalname}`;
      const bucket = 'avatars';
      const path = fileName;

      const uploadedPath = await uploadService.uploadFile(
        bucket,
        path,
        file.buffer,
        file.mimetype
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
      const fileName = `${Date.now()}-${file.originalname}`;
      // Use 'uploads' as the default bucket for generic files
      const bucket = 'uploads';
      const path = fileName;

      const uploadedPath = await uploadService.uploadFile(
        bucket,
        path,
        file.buffer,
        file.mimetype
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
      const fileData = await uploadService.getFileBuffer(bucket, path);
      
      // Cache the file for 1 year in public caches
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Content-Type', fileData.mimetype);
      res.send(fileData.buffer);
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
