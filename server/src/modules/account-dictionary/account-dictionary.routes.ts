import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware';
import { AccountDictionaryController } from './account-dictionary.controller';
import { createAccountDictionarySchema, updateAccountDictionarySchema } from './account-dictionary.schema';

const router = Router();

router.get('/', AccountDictionaryController.list);
router.post('/', validate(createAccountDictionarySchema), AccountDictionaryController.create);
router.patch('/:id', validate(updateAccountDictionarySchema), AccountDictionaryController.update);
router.delete('/:id', AccountDictionaryController.remove);

export default router;

