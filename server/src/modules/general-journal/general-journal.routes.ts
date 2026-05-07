import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware';
import { GeneralJournalController } from './general-journal.controller';
import { createGeneralJournalEntrySchema, updateGeneralJournalEntrySchema } from './general-journal.schema';

const router = Router();

router.get('/', GeneralJournalController.list);
router.post('/', validate(createGeneralJournalEntrySchema), GeneralJournalController.create);
router.patch('/:id', validate(updateGeneralJournalEntrySchema), GeneralJournalController.update);
router.delete('/:id', GeneralJournalController.remove);

export default router;

