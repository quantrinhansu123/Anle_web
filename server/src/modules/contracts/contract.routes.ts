import { Router } from 'express';
import { ContractController } from './contract.controller';
import { validate } from '@/middlewares/validate.middleware';
import { createContractSchema, updateContractSchema } from './contract.schema';

const router = Router();

router.get('/',        ContractController.list);
router.get('/:id',     ContractController.getById);
router.post('/',       validate(createContractSchema), ContractController.create);
router.patch('/:id',   validate(updateContractSchema), ContractController.update);
router.delete('/:id',  ContractController.remove);

export default router;
