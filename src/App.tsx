import { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import { useAuthStore, type UserRole } from './store/useAuthStore';
import { Leaf, Loader2 } from 'lucide-react';
import ErrorBoundary from './components/common/ErrorBoundary';
import { initLanguageCoordinator } from './utils/languageCoordinator';

// Normal User Pages
import UserDashboard from './pages/user/UserDashboard';
import UserDonations from './pages/user/UserDonations';
import UserComplaints from './pages/user/UserComplaints';
import UserTracking from './pages/user/UserTracking';
import UserSettings from './pages/user/UserSettings';

// Supermarket Official Pages
import SupermarketDashboard from './pages/supermarket/SupermarketDashboard';
import SupermarketInventory from './pages/supermarket/SupermarketInventory';
import SupermarketDonations from './pages/supermarket/SupermarketDonations';
import SupermarketComplaints from './pages/supermarket/SupermarketComplaints';
import SupermarketReports from './pages/supermarket/SupermarketReports';
import SupermarketSettings from './pages/supermarket/SupermarketSettings';

// Head Office Administrator Pages
import Dashboard from './pages/Dashboard';
import AdminSupermarkets from './pages/admin/AdminSupermarkets';
import Users from './pages/Users';
import Complaints from './pages/Complaints';
import Donations from './pages/Donations';
import Tracking from './pages/Tracking';
import MapView from './pages/MapView';
import Reports from './pages/Reports';
import AlertsNotifications from './pages/AlertsNotifications';
import AdminAuditLogs from './pages/admin/AdminAuditLogs';
import Settings from './pages/Settings';

// Unified AI Food & Waste Scan
import AiFoodWasteScan from './pages/AiFoodWasteScan';

// Real-time Voice Telecom Calling Console
import { RealtimeVoiceCallModal } from './components/telecom/RealtimeVoiceCallModal';

function RoleRoute({ 
  allowedRoles, 
  children 
}: { 
  allowedRoles: UserRole[]; 
  children: React.ReactNode 
}) {
  const { isAuthenticated, user, isInitializing } = useAuthStore();
  const location = useLocation();

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mb-3">
          <Leaf className="w-6 h-6 fill-current" />
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
          <span>Verifying FoodCovering Session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Automatically redirect to the user's authorized home dashboard
    if (user.role === 'NORMAL_USER') {
      return <Navigate to="/user/dashboard" replace />;
    } else if (user.role === 'SUPERMARKET_OFFICIAL') {
      return <Navigate to="/supermarket/dashboard" replace />;
    } else {
      return <Navigate to="/admin/dashboard" replace />;
    }
  }

  return <>{children}</>;
}

function RoleDynamicRedirect({ subPath = 'dashboard' }: { subPath?: string }) {
  const { isAuthenticated, user, isInitializing } = useAuthStore();

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'NORMAL_USER') {
    return <Navigate to={`/user/${subPath}`} replace />;
  } else if (user.role === 'SUPERMARKET_OFFICIAL') {
    return <Navigate to={`/supermarket/${subPath}`} replace />;
  } else {
    return <Navigate to={`/admin/${subPath}`} replace />;
  }
}

function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    initLanguageCoordinator();
    checkAuth();
  }, [checkAuth]);

  return (
    <Router>
      <ErrorBoundary>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Dynamic Root & Friendly Direct Redirections */}
          <Route path="/" element={<RoleDynamicRedirect subPath="dashboard" />} />
          <Route path="/dashboard" element={<RoleDynamicRedirect subPath="dashboard" />} />
          <Route path="/ai-scan" element={<RoleDynamicRedirect subPath="ai-scan" />} />
          <Route path="/scan" element={<RoleDynamicRedirect subPath="ai-scan" />} />
          <Route path="/food-analysis" element={<RoleDynamicRedirect subPath="ai-scan" />} />
          <Route path="/waste-analytics" element={<RoleDynamicRedirect subPath="ai-scan" />} />
          <Route path="/donations" element={<RoleDynamicRedirect subPath="donations" />} />
          <Route path="/complaints" element={<RoleDynamicRedirect subPath="complaints" />} />
          <Route path="/tracking" element={<RoleDynamicRedirect subPath="tracking" />} />
          <Route path="/settings" element={<RoleDynamicRedirect subPath="settings" />} />

          {/* 1. NORMAL USER ROUTES */}
          <Route path="/user" element={
            <RoleRoute allowedRoles={['NORMAL_USER']}>
              <Layout />
            </RoleRoute>
          }>
            <Route index element={<Navigate to="/user/dashboard" replace />} />
            <Route path="dashboard" element={<UserDashboard />} />
            <Route path="ai-scan" element={<AiFoodWasteScan />} />
            <Route path="food-analysis" element={<Navigate to="/user/ai-scan" replace />} />
            <Route path="waste-analytics" element={<Navigate to="/user/ai-scan" replace />} />
            <Route path="donations" element={<UserDonations />} />
            <Route path="complaints" element={<UserComplaints />} />
            <Route path="tracking" element={<UserTracking />} />
            <Route path="settings" element={<UserSettings />} />
          </Route>

          {/* 2. SUPERMARKET OFFICIAL ROUTES */}
          <Route path="/supermarket" element={
            <RoleRoute allowedRoles={['SUPERMARKET_OFFICIAL', 'HEAD_OFFICE_ADMIN']}>
              <Layout />
            </RoleRoute>
          }>
            <Route index element={<Navigate to="/supermarket/dashboard" replace />} />
            <Route path="dashboard" element={<SupermarketDashboard />} />
            <Route path="inventory" element={<SupermarketInventory />} />
            <Route path="ai-scan" element={<AiFoodWasteScan />} />
            <Route path="food-analysis" element={<Navigate to="/supermarket/ai-scan" replace />} />
            <Route path="waste-analytics" element={<Navigate to="/supermarket/ai-scan" replace />} />
            <Route path="donations" element={<SupermarketDonations />} />
            <Route path="tracking" element={<UserTracking />} />
            <Route path="complaints" element={<SupermarketComplaints />} />
            <Route path="reports" element={<SupermarketReports />} />
            <Route path="settings" element={<SupermarketSettings />} />
          </Route>

          {/* 3. HEAD OFFICE ADMINISTRATOR ROUTES */}
          <Route path="/admin" element={
            <RoleRoute allowedRoles={['HEAD_OFFICE_ADMIN']}>
              <Layout />
            </RoleRoute>
          }>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="ai-scan" element={<AiFoodWasteScan />} />
            <Route path="food-analysis" element={<Navigate to="/admin/ai-scan" replace />} />
            <Route path="waste-analytics" element={<Navigate to="/admin/ai-scan" replace />} />
            <Route path="supermarkets" element={<AdminSupermarkets />} />
            <Route path="users" element={<Users />} />
            <Route path="complaints" element={<Complaints />} />
            <Route path="donations" element={<Donations />} />
            <Route path="tracking" element={<Tracking />} />
            <Route path="map" element={<MapView />} />
            <Route path="reports" element={<Reports />} />
            <Route path="alerts" element={<AlertsNotifications />} />
            <Route path="audit-logs" element={<AdminAuditLogs />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<RoleDynamicRedirect subPath="dashboard" />} />
        </Routes>
      </ErrorBoundary>

      {/* Global Real-Time Voice Telecom Calling Console */}
      <RealtimeVoiceCallModal />
    </Router>
  );
}

export default App;
