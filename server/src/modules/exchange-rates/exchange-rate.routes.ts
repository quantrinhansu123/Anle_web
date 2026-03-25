import { Router } from 'express';
import { ExchangeRateController } from './exchange-rate.controller';
import { validate } from '../../middlewares/validate.middleware';
import { upsertExchangeRateSchema, updateExchangeRateSchema } from './exchange-rate.schema';

const router = Router();

router.get('/', ExchangeRateController.list);
router.post('/', validate(upsertExchangeRateSchema), ExchangeRateController.upsert);
router.patch('/:id', validate(updateExchangeRateSchema), ExchangeRateController.update);
router.delete('/:id', ExchangeRateController.remove);

export default router;
