import { Router } from 'express';
import { tradingSalesController } from './trading-sales.controller';

const router = Router();

/** Chỉ khớp UUID — tránh gửi slug lạ xuống Supabase */
const idParam =
  ':id([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})';

router.get('/', tradingSalesController.getAll);
router.get(`/${idParam}`, tradingSalesController.getById);
router.post('/', tradingSalesController.create);
router.patch(`/${idParam}`, tradingSalesController.update);
router.delete(`/${idParam}`, tradingSalesController.delete);

export default router;

