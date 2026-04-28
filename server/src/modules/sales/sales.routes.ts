import { Router } from 'express';
import { salesController } from './sales.controller';

const router = Router();

/** Chỉ khớp UUID — tránh gửi slug lạ xuống Supabase */
const idParam =
  ':id([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})';

router.get('/', salesController.getAll);
router.get(`/${idParam}`, salesController.getById);
router.post('/', salesController.create);
router.post(`/${idParam}/confirm`, salesController.confirm);
router.post(`/${idParam}/mark-sent`, salesController.markSent);
router.post(`/${idParam}/mark-won`, salesController.markWon);
router.post(`/${idParam}/mark-lost`, salesController.markLost);
router.post(`/${idParam}/create-job`, salesController.createJob);
router.patch(`/${idParam}`, salesController.update);
router.delete(`/${idParam}`, salesController.delete);

export default router;
