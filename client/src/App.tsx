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
import DebitNotesPage from './pages/DebitNotesPage';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/profile" element={<ProfilePage />} />
          
          {/* Logistics Modules */}
          <Route path="/shipments" element={<ModulePage />} />
          <Route path="/shipments/information" element={<ShipmentsPage />} />
          <Route path="/customers" element={<ModulePage />} />
          <Route path="/customers/directory" element={<CustomerPage />} />
          <Route path="/suppliers" element={<ModulePage />} />
          <Route path="/suppliers/directory" element={<SupplierPage />} />
          <Route path="/employees" element={<ModulePage />} />
          <Route path="/employees/candidates" element={<CandidatesPage />} />
           <Route path="/contracts" element={<ModulePage />} />
           <Route path="/contracts/directory" element={<ContractsPage />} />
          <Route path="/financials" element={<ModulePage />} />
          <Route path="/financials/sales" element={<SalesPage />} />
          <Route path="/financials/purchasing" element={<PurchasingPage />} />
          <Route path="/financials/payment-requests" element={<PaymentRequestsPage />} />
          <Route path="/financials/debit-notes" element={<DebitNotesPage />} />
          <Route path="/system" element={<ModulePage />} />
          
          <Route path="/ai-assistant" element={<AIPage />} />
          <Route path="/copyright" element={<CopyrightPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
