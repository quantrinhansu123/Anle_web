import type { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return res.status(401).json({ success: false, message: 'Invalid token' });

  // Extend Request type to include user if needed
  (req as any).user = data.user;
  next();
}
