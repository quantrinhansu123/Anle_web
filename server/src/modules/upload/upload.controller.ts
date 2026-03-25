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

      const publicUrl = await uploadService.uploadFile(
        bucket,
        path,
        file.buffer,
        file.mimetype
      );

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

      const publicUrl = await uploadService.uploadFile(
        bucket,
        path,
        file.buffer,
        file.mimetype
      );

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
};
