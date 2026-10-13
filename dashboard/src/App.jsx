import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { PageSkeleton } from './components/Skeleton';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AnalyticsPage from './pages/AnalyticsPage';
import LandingPage from './pages/LandingPage';
import AuthGatePage from './pages/AuthGatePage';
import PricingPage from './pages/PricingPage';
import FeaturesPage from './pages/FeaturesPage';

function AppRoutes() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageSkeleton />;

  const isDashboardRoute = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/analytics');
  const hideNavbar = isDashboardRoute;
  const hideFooter = ['/login', '/register', '/get-started'].includes(location.pathname) || isDashboardRoute;

  return (
    <>
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/get-started" element={user ? <Navigate to="/dashboard" replace /> : <AuthGatePage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
        <Route
          path="/dashboard"
          element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}
        />
        <Route
          path="/analytics/:shortCode"
          element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!hideFooter && <Footer />}
    </>
  );
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;