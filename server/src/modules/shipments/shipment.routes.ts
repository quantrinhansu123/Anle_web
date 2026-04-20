import { Router } from 'express';
import { ShipmentController } from './shipment.controller';
import { validate } from '../../middlewares/validate.middleware';
import {
	createShipmentSchema,
	updateShipmentSchema,
	updateShipmentStatusSchema,
	seaHouseBlPatchSchema,
} from './shipment.schema';
import { FmsJobDebitNoteController } from '../fms-job-debit-notes/fms-job-debit-note.controller';
import { createFmsJobDebitNoteSchema, updateFmsJobDebitNoteSchema } from '../fms-job-debit-notes/fms-job-debit-note.schema';
import { FmsJobInvoiceController } from '../fms-job-invoices/fms-job-invoice.controller';
import { createFmsJobInvoiceSchema, updateFmsJobInvoiceSchema, recordFmsJobInvoicePaymentSchema } from '../fms-job-invoices/fms-job-invoice.schema';
import { FmsJobPaymentNoteController } from '../fms-job-payment-notes/fms-job-payment-note.controller';
import { createFmsJobPaymentNoteSchema, updateFmsJobPaymentNoteSchema } from '../fms-job-payment-notes/fms-job-payment-note.schema';

const router = Router();

// router.use(authMiddleware);

router.get('/',        ShipmentController.list);
router.get('/next-code', ShipmentController.getNextCode);
router.get('/invoices', FmsJobInvoiceController.listAll);
router.get('/:id/readiness', ShipmentController.getReadiness);
router.get('/:id/allowed-transitions', ShipmentController.getAllowedTransitions);
router.get('/:id/run-gates', ShipmentController.getRunGates);
router.get('/:id/feasibility', ShipmentController.getFeasibility);
router.post('/:id/feasibility', ShipmentController.updateFeasibility);
router.get('/:id/bl-lines', ShipmentController.getBlLines);
router.put('/:id/bl-lines', ShipmentController.replaceBlLines);
router.get('/:id/sea-house-bl', ShipmentController.getSeaHouseBl);
router.patch('/:id/sea-house-bl', validate(seaHouseBlPatchSchema), ShipmentController.patchSeaHouseBl);

router.get('/:id/debit-notes', FmsJobDebitNoteController.list);
router.post('/:id/debit-notes', validate(createFmsJobDebitNoteSchema), FmsJobDebitNoteController.create);
router.get('/:id/debit-notes/:dnId', FmsJobDebitNoteController.getById);
router.patch('/:id/debit-notes/:dnId', validate(updateFmsJobDebitNoteSchema), FmsJobDebitNoteController.update);
router.delete('/:id/debit-notes/:dnId', FmsJobDebitNoteController.remove);

router.get('/:id/invoices', FmsJobInvoiceController.list);
router.post('/:id/invoices', validate(createFmsJobInvoiceSchema), FmsJobInvoiceController.create);
router.get('/:id/invoices/:invoiceId', FmsJobInvoiceController.getById);
router.patch('/:id/invoices/:invoiceId', validate(updateFmsJobInvoiceSchema), FmsJobInvoiceController.update);
router.delete('/:id/invoices/:invoiceId', FmsJobInvoiceController.remove);
router.post('/:id/invoices/:invoiceId/record-payment', validate(recordFmsJobInvoicePaymentSchema), FmsJobInvoiceController.recordPayment);

router.get('/:id/payment-notes', FmsJobPaymentNoteController.list);
router.post('/:id/payment-notes', validate(createFmsJobPaymentNoteSchema), FmsJobPaymentNoteController.create);
router.get('/:id/payment-notes/:pnId', FmsJobPaymentNoteController.getById);
router.patch('/:id/payment-notes/:pnId', validate(updateFmsJobPaymentNoteSchema), FmsJobPaymentNoteController.update);
router.delete('/:id/payment-notes/:pnId', FmsJobPaymentNoteController.remove);

router.get('/:id',     ShipmentController.getById);
router.post('/',       validate(createShipmentSchema), ShipmentController.create);
router.patch('/:id',   validate(updateShipmentSchema), ShipmentController.update);
router.patch('/:id/status', validate(updateShipmentStatusSchema), ShipmentController.updateStatus);
router.delete('/:id',  ShipmentController.remove);

export default router;
