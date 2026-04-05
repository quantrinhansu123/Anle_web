import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import ModulePage from './pages/ModulePage';
import AIPage from './pages/AIPage';
import CopyrightPage from './pages/CopyrightPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import CandidatesPage from './pages/CandidatesPage';
import ShipmentsPage from './pages/ShipmentsPage';
import CustomerPage from './pages/CustomerPage';
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
              
              {/* Logistics Modules */}
              <Route path="/order" element={<ModulePage />} />
              <Route path="/internal" element={<ModulePage />} />
              <Route path="/accountant" element={<ModulePage />} />
            
            <Route path="/shipments/information" element={<ShipmentsPage />} />
            <Route path="/customers/directory" element={<CustomerPage />} />
            <Route path="/suppliers/directory" element={<SupplierPage />} />
            <Route path="/suppliers/directory/:id" element={<SupplierDetailsPage />} />
            <Route path="/employees/candidates" element={<CandidatesPage />} />
            <Route path="/employees/directory" element={<EmployeesPage />} />
            <Route path="/employees/directory/:id" element={<EmployeeDetailsPage />} />
            <Route path="/contracts/directory" element={<ContractsPage />} />
            <Route path="/financials/sales" element={<SalesPage />} />
            <Route path="/financials/sales/quotation/:id" element={<HoadonAnle />} />
            <Route path="/financials/purchasing" element={<PurchasingPage />} />
            <Route path="/financials/po-approvals" element={<POApprovalsPage />} />
            <Route path="/financials/payment-requests" element={<PaymentRequestsPage />} />
            <Route path="/financials/debit-notes" element={<DebitNotesPage />} />
            <Route path="/system" element={<ModulePage />} />
            <Route path="/system/exchange-rates" element={<ExchangeRatesPage />} />
            <Route path="/system/company-info" element={<CompanyInfoPage />} />
            <Route path="/system/image-gallery" element={<ImageGalleryPage />} />
            
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
