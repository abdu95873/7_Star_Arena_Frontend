import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import PublicLayout from './components/layouts/PublicLayout.jsx';
import DashboardLayout from './components/layouts/DashboardLayout.jsx';
import AdminLayout from './components/layouts/AdminLayout.jsx';

import LandingPage from './pages/public/LandingPage.jsx';
import EventDetailPage from './pages/public/EventDetailPage.jsx';
import CheckoutPage from './pages/public/CheckoutPage.jsx';
import PaymentResultPage from './pages/public/PaymentResultPage.jsx';
import NotFoundPage from './pages/public/NotFoundPage.jsx';

import LoginPage from './pages/auth/LoginPage.jsx';
import RegisterPage from './pages/auth/RegisterPage.jsx';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/auth/ResetPasswordPage.jsx';

import MyBookingsPage from './pages/dashboard/MyBookingsPage.jsx';
import MyEventsPage from './pages/dashboard/MyEventsPage.jsx';
import ProfilePage from './pages/dashboard/ProfilePage.jsx';

import AnalyticsPage from './pages/admin/AnalyticsPage.jsx';
import AdminBookingsPage from './pages/admin/AdminBookingsPage.jsx';
import AdminSlotsPage from './pages/admin/AdminSlotsPage.jsx';
import AdminVenuesPage from './pages/admin/AdminVenuesPage.jsx';
import AdminEventsPage from './pages/admin/AdminEventsPage.jsx';
import FinancePage from './pages/admin/FinancePage.jsx';
import SettingsPage from './pages/admin/SettingsPage.jsx';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/payment/result" element={<PaymentResultPage />} />
          <Route
            path="/checkout/:type/:id"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<MyBookingsPage />} />
          <Route path="events" element={<MyEventsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AnalyticsPage />} />
          <Route path="bookings" element={<AdminBookingsPage />} />
          <Route path="slots" element={<AdminSlotsPage />} />
          <Route path="venues" element={<AdminVenuesPage />} />
          <Route path="events" element={<AdminEventsPage />} />
          <Route path="finance" element={<FinancePage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  );
}
