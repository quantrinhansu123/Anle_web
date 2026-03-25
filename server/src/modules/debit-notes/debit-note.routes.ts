import { Router } from 'express';
import { DebitNoteController } from './debit-note.controller';
import { validate } from '@/middlewares/validate.middleware';
import { createDebitNoteSchema, updateDebitNoteSchema } from './debit-note.schema';

const router = Router();

router.get('/',        DebitNoteController.list);
router.get('/:id',     DebitNoteController.getById);
router.post('/',       validate(createDebitNoteSchema), DebitNoteController.create);
router.patch('/:id',   validate(updateDebitNoteSchema), DebitNoteController.update);
router.delete('/:id',  DebitNoteController.remove);

export default router;
