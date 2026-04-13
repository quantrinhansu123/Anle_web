import { Router } from 'express';
import { jobController } from './job.controller';
import { validate } from '../../middlewares/validate.middleware';
import {
  createFmsJobSchema,
  updateFmsJobSchema,
  patchJobWorkflowSchema,
} from './job.schema';

const router = Router();

const idParam = ':id([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})';

router.get('/', jobController.list);
router.post('/', validate(createFmsJobSchema), jobController.create);
router.get(`/${idParam}`, jobController.getById);
router.patch(`/${idParam}`, validate(updateFmsJobSchema), jobController.update);
router.patch(`/${idParam}/workflow`, validate(patchJobWorkflowSchema), jobController.patchWorkflow);
router.delete(`/${idParam}`, jobController.remove);

export default router;
