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
import PlaceholderPage from './pages/PlaceholderPage';
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
                <Route path="/operations" element={<ModulePage />} />
                <Route path="/marketing" element={<ModulePage />} />
                <Route path="/hr" element={<ModulePage />} />
                <Route path="/finance" element={<ModulePage />} />
                <Route path="/productivity" element={<ModulePage />} />
                <Route path="/system" element={<ModulePage />} />

                {/* Existing Routes */}
                <Route path="/shipments/information" element={<ShipmentsPage />} />
                <Route path="/customers/directory" element={<CustomerPage />} />
                <Route path="/customers/directory/:id" element={<CustomerDetailsPage />} />
                <Route path="/suppliers/directory" element={<SupplierPage />} />
                <Route path="/suppliers/directory/:id" element={<SupplierDetailsPage />} />
                <Route path="/employees/candidates" element={<PlaceholderPage />} />
                <Route path="/employees/directory" element={<EmployeesPage />} />
                <Route path="/employees/directory/:id" element={<EmployeeDetailsPage />} />
                <Route path="/contracts/directory" element={<ContractsPage />} />
                <Route path="/financials/sales" element={<SalesPage />} />
                <Route path="/financials/sales/quotation/:id" element={<HoadonAnle />} />
                <Route path="/financials/purchasing" element={<PurchasingPage />} />
                <Route path="/financials/po-approvals" element={<POApprovalsPage />} />
                <Route path="/financials/payment-requests" element={<PaymentRequestsPage />} />
                <Route path="/financials/debit-notes" element={<DebitNotesPage />} />
                <Route path="/system/exchange-rates" element={<ExchangeRatesPage />} />
                <Route path="/system/company-info" element={<CompanyInfoPage />} />
                <Route path="/system/image-gallery" element={<ImageGalleryPage />} />

                {/* Placeholder Routes */}
                <Route path="/inventory" element={<PlaceholderPage />} />
                <Route path="/fleet" element={<PlaceholderPage />} />
                <Route path="/crm" element={<PlaceholderPage />} />
                <Route path="/contacts/directory" element={<PlaceholderPage />} />
                <Route path="/website" element={<PlaceholderPage />} />
                <Route path="/email-marketing" element={<PlaceholderPage />} />
                <Route path="/link-tracker" element={<PlaceholderPage />} />
                <Route path="/projects" element={<PlaceholderPage />} />
                <Route path="/elearning" element={<PlaceholderPage />} />
                <Route path="/financials/invoicing" element={<PlaceholderPage />} />
                <Route path="/financials/expenses" element={<PlaceholderPage />} />
                <Route path="/financials/advances" element={<PlaceholderPage />} />
                <Route path="/discuss" element={<PlaceholderPage />} />
                <Route path="/calendar" element={<PlaceholderPage />} />
                <Route path="/activity-dashboard" element={<PlaceholderPage />} />
                <Route path="/my-dashboard" element={<PlaceholderPage />} />
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
