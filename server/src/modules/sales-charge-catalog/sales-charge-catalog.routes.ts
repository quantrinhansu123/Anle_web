import { Router } from 'express';
import { SalesChargeCatalogController } from './sales-charge-catalog.controller';
import { validate } from '../../middlewares/validate.middleware';
import { createSalesChargeCatalogSchema, updateSalesChargeCatalogSchema } from './sales-charge-catalog.schema';

const router = Router();

router.get('/', SalesChargeCatalogController.list);
router.post('/', validate(createSalesChargeCatalogSchema), SalesChargeCatalogController.create);
router.patch('/:id', validate(updateSalesChargeCatalogSchema), SalesChargeCatalogController.update);
router.delete('/:id', SalesChargeCatalogController.remove);

export default router;
