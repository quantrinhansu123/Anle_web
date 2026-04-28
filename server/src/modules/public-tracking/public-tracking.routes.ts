import { Router } from 'express';
import { PublicTrackingController } from './public-tracking.controller';

const router = Router();

router.get('/', PublicTrackingController.track);

export default router;

