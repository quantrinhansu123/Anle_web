import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import ModulePage from './pages/ModulePage';
import AIPage from './pages/AIPage';
import CopyrightPage from './pages/CopyrightPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/hanh-chinh" element={<ModulePage />} />
          <Route path="/nhan-su" element={<ModulePage />} />
          <Route path="/kinh-doanh" element={<ModulePage />} />
          <Route path="/marketing" element={<ModulePage />} />
          <Route path="/tai-chinh" element={<ModulePage />} />
          <Route path="/mua-hang" element={<ModulePage />} />
          <Route path="/kho-van" element={<ModulePage />} />
          <Route path="/dieu-hanh" element={<ModulePage />} />
          <Route path="/he-thong" element={<ModulePage />} />
          <Route path="/tro-ly-ai" element={<AIPage />} />
          <Route path="/ban-quyen" element={<CopyrightPage />} />
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
