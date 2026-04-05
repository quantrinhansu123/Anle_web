import { Router } from 'express';
import multer from 'multer';
import { uploadController } from './upload.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', uploadController.listFiles);
router.post('/', upload.single('file'), uploadController.uploadGenericFile);
router.post('/avatar', upload.single('file'), uploadController.uploadAvatar);

export default router;
