import { Router } from 'express';
import { accessControlController } from './access-control.controller';
import { authorize } from '../../middlewares/authorize.middleware';

const router = Router();

// System admin level (admin / senior hierarchy via authorize)
router.use(authorize('ceo', 'director', 'admin', 'senior'));

router.get('/role-keys', accessControlController.listRoleKeys);
router.post('/role-keys', accessControlController.createRoleKey);
router.delete('/role-keys/:key', accessControlController.deleteRoleKey);

router.get('/permissions/:roleKey', accessControlController.getPermissions);
router.put('/permissions/:roleKey', accessControlController.setPermissions);

export default router;
