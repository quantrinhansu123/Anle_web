import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorMiddleware } from '@/middlewares/error.middleware';
import { successResponse } from '@/utils/response';

// Routes
import customerRoutes from '@/modules/customers/customer.routes';
import supplierRoutes from '@/modules/suppliers/supplier.routes';
import shipmentRoutes from '@/modules/shipments/shipment.routes';
import salesRoutes from '@/modules/sales/sales.routes';
import purchasingRoutes from '@/modules/purchasing/purchasing.routes';
import employeeRoutes from '@/modules/employees/employee.routes';
import contractRoutes from '@/modules/contracts/contract.routes';
import paymentRequestRoutes from '@/modules/payment-requests/payment-request.routes';
import debitNoteRoutes from '@/modules/debit-notes/debit-note.routes';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

const v1 = '/api/v1';

// Health check
app.get(`${v1}/health`, (req, res) => {
  res.json(successResponse({ status: 'ok' }, 'Server is running'));
});

// Register module routes
app.use(`${v1}/customers`, customerRoutes);
app.use(`${v1}/suppliers`, supplierRoutes);
app.use(`${v1}/shipments`, shipmentRoutes);
app.use(`${v1}/sales`, salesRoutes);
app.use(`${v1}/purchasing`, purchasingRoutes);
app.use(`${v1}/employees`, employeeRoutes);
app.use(`${v1}/contracts`, contractRoutes);
app.use(`${v1}/payment-requests`, paymentRequestRoutes);
app.use(`${v1}/debit-notes`, debitNoteRoutes);

app.use(errorMiddleware);

export default app;
