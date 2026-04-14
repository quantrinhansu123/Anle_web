import { Router } from 'express';
import { jobController } from './job.controller';
import { validate } from '../../middlewares/validate.middleware';
import {
  createFmsJobSchema,
  updateFmsJobSchema,
  patchJobWorkflowSchema,
  seaHouseBlPatchSchema,
} from './job.schema';
import { FmsJobDebitNoteController } from '../fms-job-debit-notes/fms-job-debit-note.controller';
import {
  createFmsJobDebitNoteSchema,
  updateFmsJobDebitNoteSchema,
} from '../fms-job-debit-notes/fms-job-debit-note.schema';
import { FmsJobInvoiceController } from '../fms-job-invoices/fms-job-invoice.controller';
import {
  createFmsJobInvoiceSchema,
  recordFmsJobInvoicePaymentSchema,
  updateFmsJobInvoiceSchema,
} from '../fms-job-invoices/fms-job-invoice.schema';
import { FmsJobPaymentNoteController } from '../fms-job-payment-notes/fms-job-payment-note.controller';
import {
  createFmsJobPaymentNoteSchema,
  updateFmsJobPaymentNoteSchema,
} from '../fms-job-payment-notes/fms-job-payment-note.schema';

const router = Router();

const idParam = ':id([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})';
const dnIdParam =
  ':dnId([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})';
const invIdParam =
  ':invoiceId([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})';
const pnIdParam =
  ':pnId([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})';

router.get('/', jobController.list);
router.post('/', validate(createFmsJobSchema), jobController.create);

router.get('/invoices', FmsJobInvoiceController.listAll);

router.get(`/${idParam}/sea-house-bl`, jobController.getSeaHouseBl);
router.patch(`/${idParam}/sea-house-bl`, validate(seaHouseBlPatchSchema), jobController.patchSeaHouseBl);

router.get(`/${idParam}/debit-notes`, FmsJobDebitNoteController.list);
router.post(`/${idParam}/debit-notes`, validate(createFmsJobDebitNoteSchema), FmsJobDebitNoteController.create);
router.get(`/${idParam}/debit-notes/${dnIdParam}`, FmsJobDebitNoteController.getById);
router.patch(`/${idParam}/debit-notes/${dnIdParam}`, validate(updateFmsJobDebitNoteSchema), FmsJobDebitNoteController.update);
router.delete(`/${idParam}/debit-notes/${dnIdParam}`, FmsJobDebitNoteController.remove);

router.get(`/${idParam}/invoices`, FmsJobInvoiceController.list);
router.post(`/${idParam}/invoices`, validate(createFmsJobInvoiceSchema), FmsJobInvoiceController.create);
router.get(`/${idParam}/invoices/${invIdParam}`, FmsJobInvoiceController.getById);
router.patch(`/${idParam}/invoices/${invIdParam}`, validate(updateFmsJobInvoiceSchema), FmsJobInvoiceController.update);
router.delete(`/${idParam}/invoices/${invIdParam}`, FmsJobInvoiceController.remove);
router.post(
  `/${idParam}/invoices/${invIdParam}/record-payment`,
  validate(recordFmsJobInvoicePaymentSchema),
  FmsJobInvoiceController.recordPayment,
);

router.get(`/${idParam}/payment-notes`, FmsJobPaymentNoteController.list);
router.post(`/${idParam}/payment-notes`, validate(createFmsJobPaymentNoteSchema), FmsJobPaymentNoteController.create);
router.get(`/${idParam}/payment-notes/${pnIdParam}`, FmsJobPaymentNoteController.getById);
router.patch(
  `/${idParam}/payment-notes/${pnIdParam}`,
  validate(updateFmsJobPaymentNoteSchema),
  FmsJobPaymentNoteController.update,
);
router.delete(`/${idParam}/payment-notes/${pnIdParam}`, FmsJobPaymentNoteController.remove);

router.get(`/${idParam}`, jobController.getById);
router.patch(`/${idParam}`, validate(updateFmsJobSchema), jobController.update);
router.patch(`/${idParam}/workflow`, validate(patchJobWorkflowSchema), jobController.patchWorkflow);
router.delete(`/${idParam}`, jobController.remove);

export default router;
