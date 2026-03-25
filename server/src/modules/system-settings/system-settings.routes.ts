import { Router } from 'express';
import { SystemSettingsController } from './system-settings.controller';

const router = Router();

router.get('/', SystemSettingsController.getSettings);
router.patch('/:id', SystemSettingsController.updateSettings);

export default router;
