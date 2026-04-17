import { Router } from 'express';
import { departmentController } from './department.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', departmentController.getAllDepartments);
router.get('/teams', departmentController.getAllTeams);
router.get('/:code/teams', departmentController.getTeamsByDepartment);

export default router;
