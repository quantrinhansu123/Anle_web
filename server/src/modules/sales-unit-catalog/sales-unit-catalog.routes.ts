import { Router } from 'express';
import { SalesUnitCatalogController } from './sales-unit-catalog.controller';
import { validate } from '../../middlewares/validate.middleware';
import { createSalesUnitCatalogSchema } from './sales-unit-catalog.schema';

const router = Router();

router.get('/', SalesUnitCatalogController.list);
router.post('/', validate(createSalesUnitCatalogSchema), SalesUnitCatalogController.create);

export default router;
