import { Router } from 'express';
import { authController } from './auth.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();

router.post('/login', authController.login);
// Note: /me is protected by global authMiddleware in app.ts if called as /api/v1/auth/me? 
// No, app.use(authMiddleware) is AFTER app.use(authRoutes). So /auth/me needs it here.
router.get('/me', authMiddleware, authController.getMe);

export default router;
