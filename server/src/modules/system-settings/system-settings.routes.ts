import { Router } from 'express';
import { SystemSettingsController } from './system-settings.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();

router.get('/', SystemSettingsController.getSettings);
router.patch('/:id', authMiddleware, SystemSettingsController.updateSettings);

export default router;
