import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorMiddleware } from './middlewares/error.middleware';
import { successResponse } from './utils/response';

// Routes
import customerRoutes from './modules/customers/customer.routes';
import supplierRoutes from './modules/suppliers/supplier.routes';
import shipmentRoutes from './modules/shipments/shipment.routes';
import salesRoutes from './modules/sales/sales.routes';
import purchasingRoutes from './modules/purchasing/purchasing.routes';
import employeeRoutes from './modules/employees/employee.routes';
import contractRoutes from './modules/contracts/contract.routes';
import paymentRequestRoutes from './modules/payment-requests/payment-request.routes';
import debitNoteRoutes from './modules/debit-notes/debit-note.routes';
import exchangeRateRoutes from './modules/exchange-rates/exchange-rate.routes';
import systemSettingsRoutes from './modules/system-settings/system-settings.routes';
import uploadRoutes from './modules/upload/upload.routes';
import shipmentDocumentRoutes from './modules/shipment-documents/shipment-document.routes';
import customsClearanceRoutes from './modules/customs-clearances/customs-clearance.routes';
import salesChargeCatalogRoutes from './modules/sales-charge-catalog/sales-charge-catalog.routes';
import salesUnitCatalogRoutes from './modules/sales-unit-catalog/sales-unit-catalog.routes';
import fmsDashboardRoutes from './modules/fms-dashboard/fms-dashboard.routes';
import businessDashboardRoutes from './modules/business-dashboard/business-dashboard.routes';
import reportsRoutes from './modules/reports/reports.routes';

import salaryAdvanceRequestRoutes from './modules/salary-advance-requests/salary-advance-request.routes';
import customerExpenseRoutes from './modules/customer-expenses/customer-expense.routes';
import accountingDashboardRoutes from './modules/accounting-dashboard/accounting-dashboard.routes';
import { uploadController } from './modules/upload/upload.controller';
import authRoutes from './modules/auth/auth.routes';
import departmentRoutes from './modules/departments/department.routes';
import { authMiddleware } from './middlewares/auth.middleware';
import { authorize } from './middlewares/authorize.middleware';
import shipmentCostRoutes from './modules/shipment-costs/shipment-cost.routes';
import transportBookingRoutes from './modules/transport-bookings/transport-booking.routes';
import shipmentTrackingRoutes from './modules/shipment-tracking/shipment-tracking.routes';
import shipmentIncidentRoutes from './modules/shipment-incidents/shipment-incident.routes';
import shippingAgentRoutes from './modules/shipping-agents/shipping-agent.routes';
import approvalRequestRoutes from './modules/approval-requests/approval-request.routes';
import notificationRoutes from './modules/notifications/notification.routes';
import { departmentAccess } from './middlewares/authorize.middleware';
import publicTrackingRoutes from './modules/public-tracking/public-tracking.routes';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

const v1 = '/api/v1';

// Public routes
app.get(`${v1}/health`, (req, res) => {
  res.json(successResponse({ status: 'ok' }, 'Server is running'));
});
app.use(`${v1}/auth`, authRoutes); // Auth routes handles its own protection internally for /me
app.use(`${v1}/system-settings`, systemSettingsRoutes);
app.get(`${v1}/f/:bucket/:path`, uploadController.serveFile);
app.use(`${v1}/public-tracking`, publicTrackingRoutes);

// Protected routes
app.use(authMiddleware);

app.use(`${v1}/customers`, customerRoutes);
app.use(`${v1}/suppliers`, supplierRoutes);
app.use(`${v1}/shipments`, shipmentRoutes);
app.use(`${v1}/fms-dashboard`, fmsDashboardRoutes);
app.use(`${v1}/business-dashboard`, businessDashboardRoutes);
app.use(`${v1}/reports`, reportsRoutes);
app.use(`${v1}/sales`, departmentAccess('sales', 'bod'), salesRoutes);
app.use(`${v1}/sales-charge-catalog`, salesChargeCatalogRoutes);
app.use(`${v1}/sales-unit-catalog`, salesUnitCatalogRoutes);
app.use(`${v1}/purchasing`, departmentAccess('procurement', 'bod'), purchasingRoutes);
app.use(`${v1}/employees`, authorize('ceo', 'director', 'manager'), employeeRoutes);
app.use(`${v1}/departments`, departmentRoutes);
app.use(`${v1}/approval-requests`, approvalRequestRoutes);
app.use(`${v1}/contracts`, contractRoutes);
app.use(`${v1}/payment-requests`, paymentRequestRoutes);
app.use(`${v1}/salary-advance-requests`, salaryAdvanceRequestRoutes);
app.use(`${v1}/customer-expenses`, customerExpenseRoutes);
app.use(`${v1}/accounting-dashboard`, accountingDashboardRoutes);
app.use(`${v1}/debit-notes`, debitNoteRoutes);
app.use(`${v1}/exchange-rates`, exchangeRateRoutes);
app.use(`${v1}/shipment-documents`, shipmentDocumentRoutes);
app.use(`${v1}/customs-clearances`, customsClearanceRoutes);
app.use(`${v1}/shipment-costs`, shipmentCostRoutes);
app.use(`${v1}/transport-bookings`, transportBookingRoutes);
app.use(`${v1}/shipment-tracking`, shipmentTrackingRoutes);
app.use(`${v1}/shipment-incidents`, shipmentIncidentRoutes);
app.use(`${v1}/shipping-agents`, shippingAgentRoutes);
app.use(`${v1}/notifications`, notificationRoutes);
app.use(`${v1}/upload`, uploadRoutes);

// Catch-all 404 handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use(errorMiddleware);

export default app;
