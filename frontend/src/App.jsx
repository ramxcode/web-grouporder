import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Pages
import LoginPage from './pages/Login';
import MaintenancePage from './pages/Maintenance';

// Seller Pages
import SellerDashboard from './pages/seller/Dashboard';
import StatusOrder from './pages/seller/StatusOrder';
import DataOrder from './pages/seller/DataOrder';
import Rekapan from './pages/seller/Rekapan';
import SellerPayment from './pages/seller/Payment';
import SellerStok from './pages/seller/Stok';
import Buyers from './pages/seller/Buyers';
import AuditLog from './pages/seller/AuditLog';
import SellerSettings from './pages/seller/Settings';

// Buyer Pages
import BuyerDashboard from './pages/buyer/Dashboard';
import BuyerStatusOrder from './pages/buyer/StatusOrder';
import BuyerPayment from './pages/buyer/Payment';
import BuyerStok from './pages/buyer/Stok';

// Owner (Super Admin) Pages
import OwnerDashboard from './pages/owner/Dashboard';
import OwnerSellers from './pages/owner/Sellers';
import OwnerSellerDetail from './pages/owner/SellerDetail';
import OwnerBuyers from './pages/owner/Buyers';
import OwnerOrders from './pages/owner/Orders';
import OwnerPayments from './pages/owner/Payments';
import OwnerStocks from './pages/owner/Stocks';
import OwnerInvoices from './pages/owner/Invoices';
import OwnerReports from './pages/owner/Reports';
import OwnerWebsiteSettings from './pages/owner/WebsiteSettings';
import OwnerAuditLog from './pages/owner/AuditLog';
import OwnerProfile from './pages/owner/Profile';
import OwnerAdminManagement from './pages/owner/AdminManagement';

// Shared Pages
import Notifications from './pages/shared/Notifications';

// Redirect based on role helper
function getRoleHome(role) {
  if (role === 'super_admin') return '/owner/dashboard';
  if (role === 'seller') return '/seller/dashboard';
  return '/buyer/dashboard';
}

// Protected Route with maintenance mode support
function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, user, loading, websiteSettings } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)', flexDirection: 'column', gap: 16,
      }}>
        <div style={{
          width: 48, height: 48, border: '3px solid var(--primary)', borderTopColor: 'transparent',
          borderRadius: '50%', animation: 'spin 0.8s linear infinite',
        }} />
        <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Memuat...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Maintenance mode: redirect non-super_admin users
  if (websiteSettings?.maintenanceMode && user?.role !== 'super_admin') {
    return <MaintenancePage settings={websiteSettings} />;
  }

  // Role check — super_admin can access anything except strict buyer routes
  const role = user?.role;
  if (requiredRole && role !== requiredRole && role !== 'super_admin') {
    return <Navigate to={getRoleHome(role)} replace />;
  }

  return children;
}

function AppRoutes() {
  const { user, isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route
        path="/login"
        element={
          isAuthenticated
            ? <Navigate to={getRoleHome(user?.role)} replace />
            : <LoginPage />
        }
      />

      {/* --- OWNER / SUPER ADMIN Routes --- */}
      <Route path="/owner/dashboard" element={<ProtectedRoute requiredRole="super_admin"><OwnerDashboard /></ProtectedRoute>} />
      <Route path="/owner/sellers" element={<ProtectedRoute requiredRole="super_admin"><OwnerSellers /></ProtectedRoute>} />
      <Route path="/owner/sellers/:id" element={<ProtectedRoute requiredRole="super_admin"><OwnerSellerDetail /></ProtectedRoute>} />
      <Route path="/owner/buyers" element={<ProtectedRoute requiredRole="super_admin"><OwnerBuyers /></ProtectedRoute>} />
      <Route path="/owner/orders" element={<ProtectedRoute requiredRole="super_admin"><OwnerOrders /></ProtectedRoute>} />
      <Route path="/owner/payments" element={<ProtectedRoute requiredRole="super_admin"><OwnerPayments /></ProtectedRoute>} />
      <Route path="/owner/stocks" element={<ProtectedRoute requiredRole="super_admin"><OwnerStocks /></ProtectedRoute>} />
      <Route path="/owner/invoices" element={<ProtectedRoute requiredRole="super_admin"><OwnerInvoices /></ProtectedRoute>} />
      <Route path="/owner/reports" element={<ProtectedRoute requiredRole="super_admin"><OwnerReports /></ProtectedRoute>} />
      <Route path="/owner/website-settings" element={<ProtectedRoute requiredRole="super_admin"><OwnerWebsiteSettings /></ProtectedRoute>} />
      <Route path="/owner/notifications" element={<ProtectedRoute requiredRole="super_admin"><Notifications /></ProtectedRoute>} />
      <Route path="/owner/audit-log" element={<ProtectedRoute requiredRole="super_admin"><OwnerAuditLog /></ProtectedRoute>} />
      <Route path="/owner/profile" element={<ProtectedRoute requiredRole="super_admin"><OwnerProfile /></ProtectedRoute>} />
      <Route path="/owner/admin-management" element={<ProtectedRoute requiredRole="super_admin"><OwnerAdminManagement /></ProtectedRoute>} />

      {/* --- Seller Routes --- */}
      <Route path="/seller/dashboard" element={<ProtectedRoute requiredRole="seller"><SellerDashboard /></ProtectedRoute>} />
      <Route path="/seller/status-order" element={<ProtectedRoute requiredRole="seller"><StatusOrder /></ProtectedRoute>} />
      <Route path="/seller/data-order" element={<ProtectedRoute requiredRole="seller"><DataOrder /></ProtectedRoute>} />
      <Route path="/seller/rekapan" element={<ProtectedRoute requiredRole="seller"><Rekapan /></ProtectedRoute>} />
      <Route path="/seller/payment" element={<ProtectedRoute requiredRole="seller"><SellerPayment /></ProtectedRoute>} />
      <Route path="/seller/stok" element={<ProtectedRoute requiredRole="seller"><SellerStok /></ProtectedRoute>} />
      <Route path="/seller/buyers" element={<ProtectedRoute requiredRole="seller"><Buyers /></ProtectedRoute>} />
      <Route path="/seller/notifikasi" element={<ProtectedRoute requiredRole="seller"><Notifications /></ProtectedRoute>} />
      <Route path="/seller/audit-log" element={<ProtectedRoute requiredRole="seller"><AuditLog /></ProtectedRoute>} />
      <Route path="/seller/settings" element={<ProtectedRoute requiredRole="seller"><SellerSettings /></ProtectedRoute>} />

      {/* --- Buyer Routes --- */}
      <Route path="/buyer/dashboard" element={<ProtectedRoute requiredRole="buyer"><BuyerDashboard /></ProtectedRoute>} />
      <Route path="/buyer/status-order" element={<ProtectedRoute requiredRole="buyer"><BuyerStatusOrder /></ProtectedRoute>} />
      <Route path="/buyer/payment" element={<ProtectedRoute requiredRole="buyer"><BuyerPayment /></ProtectedRoute>} />
      <Route path="/buyer/stok" element={<ProtectedRoute requiredRole="buyer"><BuyerStok /></ProtectedRoute>} />
      <Route path="/buyer/notifikasi" element={<ProtectedRoute requiredRole="buyer"><Notifications /></ProtectedRoute>} />

      {/* Default Redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: 'var(--bg-card)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                fontSize: '13.5px',
                fontFamily: 'Inter, sans-serif',
              },
              success: {
                iconTheme: { primary: '#10b981', secondary: '#fff' },
              },
              error: {
                iconTheme: { primary: '#ef4444', secondary: '#fff' },
              },
            }}
          />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
