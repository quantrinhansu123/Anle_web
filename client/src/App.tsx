import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import ModulePage from './pages/ModulePage';
import AIPage from './pages/AIPage';
import CopyrightPage from './pages/CopyrightPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import ShipmentsPage from './pages/ShipmentsPage';
import CustomerPage from './pages/CustomerPage';
import CustomerDetailsPage from './pages/customers/CustomerDetailsPage';
import SupplierPage from './pages/SupplierPage';
import SalesPage from './pages/SalesPage';
import PurchasingPage from './pages/PurchasingPage';
import ContractsPage from './pages/ContractsPage';
import PaymentRequestsPage from './pages/PaymentRequestsPage';
import POApprovalsPage from './pages/POApprovalsPage';
import DebitNotesPage from './pages/DebitNotesPage';
import ExchangeRatesPage from './pages/ExchangeRatesPage';
import EmployeesPage from './pages/EmployeesPage';
import EmployeeDetailsPage from './pages/employees/EmployeeDetailsPage';
import SupplierDetailsPage from './pages/suppliers/SupplierDetailsPage';
import CompanyInfoPage from './pages/system/CompanyInfoPage';
import ImageGalleryPage from './pages/system/ImageGalleryPage';
import HoadonAnle from './pages/sales/HoadonAnle';
import SalesEditorPage from './pages/sales/SalesEditorPage';
import SalesChargeCatalogPage from './pages/SalesChargeCatalogPage';
import PlaceholderPage from './pages/PlaceholderPage';
import InventoryOverviewPage from './pages/inventory/InventoryOverviewPage';
import InventoryStockReportPage from './pages/inventory/InventoryStockReportPage';
import SalaryAdvancesPage from './pages/SalaryAdvancesPage';
import CustomerExpensesPage from './pages/CustomerExpensesPage';
import AccountingDashboardPage from './pages/AccountingDashboardPage';
import BalanceSheetPage from './pages/financials/BalanceSheetPage';
import ProfitLossPage from './pages/financials/ProfitLossPage';
import CashFlowPage from './pages/financials/CashFlowPage';
import ReceivableAgingPage from './pages/financials/ReceivableAgingPage';
import FmsDashboardPage from './pages/shipping/FmsDashboardPage';
import BusinessDashboardPage from './pages/shipping/BusinessDashboardPage';
import JobPage from './pages/JobPage';
import JobEditorPage from './pages/jobs/JobEditorPage';
import CreateSeaHouseBLPage from './pages/jobs/CreateSeaHouseBLPage';
import ArrivalNoticePage from './pages/jobs/ArrivalNoticePage';
import HouseSeaBlListPage from './pages/jobs/HouseSeaBlListPage';
import DebitNotePage from './pages/jobs/DebitNotePage';
import PaymentNotePage from './pages/jobs/PaymentNotePage';
import InvoicingPage from './pages/InvoicingPage';
import InvoicesManagementPage from './pages/InvoicesManagementPage';
import JobProfitByPerformanceDatePage from './pages/reports/JobProfitByPerformanceDatePage';
import LoginPage from './pages/auth/LoginPage';
import { AuthProvider } from './contexts/AuthContext';
import { BreadcrumbProvider } from './contexts/BreadcrumbContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { ToastProvider } from './contexts/ToastContext';

function App() {

  return (
    <AuthProvider>
      <ToastProvider>
        <BreadcrumbProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/profile" element={<ProfilePage />} />

                {/* Module Directory Pages */}
                <Route path="/shipping" element={<ModulePage />} />
                <Route path="/operations" element={<ModulePage />} />
                <Route path="/marketing" element={<ModulePage />} />
                <Route path="/hr" element={<ModulePage />} />
                <Route path="/finance" element={<ModulePage />} />
                <Route path="/productivity" element={<ModulePage />} />
                <Route path="/reports" element={<ModulePage />} />
                <Route path="/system" element={<ModulePage />} />
                <Route path="/inventory" element={<ModulePage />} />

                {/* Existing Routes */}
                <Route path="/shipments/information" element={<ShipmentsPage />} />
                <Route path="/shipping/jobs/new" element={<JobEditorPage />} />
                <Route path="/shipping/jobs/:id/edit" element={<JobEditorPage />} />
                <Route path="/shipping/jobs/:id/sea-house-bl" element={<CreateSeaHouseBLPage />} />
                <Route path="/shipping/jobs/:id/arrival-notice" element={<ArrivalNoticePage />} />
                <Route path="/shipping/jobs/:id/sea-house-bl/debit-note" element={<DebitNotePage />} />
                <Route path="/shipping/jobs/:id/sea-house-bl/debit-note/:dnId" element={<DebitNotePage />} />
                <Route path="/shipping/jobs/:id/sea-house-bl/payment-note" element={<PaymentNotePage />} />
                <Route path="/shipping/jobs/:id/sea-house-bl/payment-note/:pnId" element={<PaymentNotePage />} />
                <Route path="/reports/job-profit-by-performance-date" element={<JobProfitByPerformanceDatePage />} />
                <Route path="/shipping/house-sea-bl" element={<HouseSeaBlListPage />} />
                <Route path="/shipping/jobs" element={<JobPage />} />
                <Route path="/operations/jobs" element={<Navigate to="/shipping/jobs" replace />} />
                <Route path="/customers/directory" element={<CustomerPage />} />
                <Route path="/customers/directory/:id" element={<CustomerDetailsPage />} />
                <Route path="/suppliers/directory" element={<SupplierPage />} />
                <Route path="/suppliers/directory/:id" element={<SupplierDetailsPage />} />
                <Route path="/employees/candidates" element={<PlaceholderPage />} />
                <Route path="/employees/directory" element={<EmployeesPage />} />
                <Route path="/employees/directory/:id" element={<EmployeeDetailsPage />} />
                <Route path="/contracts/directory" element={<ContractsPage />} />
                <Route path="/financials/sales" element={<SalesPage />} />
                <Route path="/financials/sales/new" element={<SalesEditorPage mode="add" />} />
                <Route path="/financials/sales/:id" element={<SalesEditorPage mode="detail" />} />
                <Route path="/financials/sales/:id/edit" element={<SalesEditorPage mode="edit" />} />
                <Route path="/financials/sales/quotation/:id" element={<HoadonAnle />} />
                <Route path="/financials/sales-charges" element={<SalesChargeCatalogPage />} />
                <Route path="/financials/purchasing" element={<PurchasingPage />} />
                <Route path="/financials/po-approvals" element={<POApprovalsPage />} />
                <Route path="/financials/payment-requests" element={<PaymentRequestsPage />} />
                <Route path="/financials/debit-notes" element={<DebitNotesPage />} />
                <Route path="/system/exchange-rates" element={<ExchangeRatesPage />} />
                <Route path="/system/company-info" element={<CompanyInfoPage />} />
                <Route path="/system/image-gallery" element={<ImageGalleryPage />} />

                {/* Placeholder Routes */}
                <Route path="/inventory/overview" element={<InventoryOverviewPage />} />
                <Route path="/inventory/stock" element={<InventoryStockReportPage />} />
                <Route path="/fleet" element={<PlaceholderPage />} />
                <Route path="/crm" element={<PlaceholderPage />} />
                <Route path="/contacts/directory" element={<PlaceholderPage />} />
                <Route path="/website" element={<PlaceholderPage />} />
                <Route path="/email-marketing" element={<PlaceholderPage />} />
                <Route path="/link-tracker" element={<PlaceholderPage />} />
                <Route path="/projects" element={<PlaceholderPage />} />
                <Route path="/elearning" element={<PlaceholderPage />} />
                <Route path="/financials/accounting-dashboard" element={<AccountingDashboardPage />} />
                <Route path="/financials/balance-sheet" element={<BalanceSheetPage />} />
                <Route path="/financials/profit-loss" element={<ProfitLossPage />} />
                <Route path="/financials/cash-flow" element={<CashFlowPage />} />
                <Route path="/financials/receivable-aging" element={<ReceivableAgingPage />} />
                <Route path="/financials/invoices" element={<InvoicesManagementPage />} />
                <Route path="/financials/invoicing" element={<InvoicingPage />} />
                <Route path="/financials/expenses" element={<CustomerExpensesPage />} />
                <Route path="/financials/advances" element={<SalaryAdvancesPage />} />
                <Route path="/discuss" element={<PlaceholderPage />} />
                <Route path="/calendar" element={<PlaceholderPage />} />
                <Route path="/activity-dashboard" element={<PlaceholderPage />} />
                <Route path="/my-dashboard" element={<PlaceholderPage />} />
                <Route path="/shipping/dashboard-fms" element={<FmsDashboardPage />} />
                <Route path="/shipping/business-dashboard" element={<BusinessDashboardPage />} />
                <Route path="/apps" element={<PlaceholderPage />} />
                <Route path="/system/job-queue" element={<PlaceholderPage />} />
                <Route path="/system/mass-activities" element={<PlaceholderPage />} />

                <Route path="/ai-assistant" element={<AIPage />} />
                <Route path="/copyright" element={<CopyrightPage />} />
                <Route path="/settings" element={<SettingsPage />} />

                {/* Fallback route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </BreadcrumbProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
