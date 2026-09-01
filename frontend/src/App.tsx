import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/hooks/useAuth'
import { ThemeProvider } from '@/hooks/useTheme'
import { ToastProvider } from '@/hooks/useToast'
import { AppLayout } from '@/layouts/AppLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { AdminLayout } from '@/layouts/AdminLayout'
import { ProtectedRoute, AdminRoute } from '@/layouts/ProtectedRoute'

import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import ForgotPassword from '@/pages/auth/ForgotPassword'
import ResetPassword from '@/pages/auth/ResetPassword'

import Dashboard from '@/pages/Dashboard'
import Accounts from '@/pages/Accounts'
import Transactions from '@/pages/Transactions'
import Payments from '@/pages/Payments'
import Beneficiaries from '@/pages/Beneficiaries'
import Cards from '@/pages/Cards'
import Kyc from '@/pages/Kyc'
import Budgets from '@/pages/Budgets'
import Savings from '@/pages/Savings'
import Analytics from '@/pages/Analytics'
import Notifications from '@/pages/Notifications'
import Settings from '@/pages/Settings'
import NotFound from '@/pages/NotFound'

import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminUsers from '@/pages/admin/AdminUsers'
import AdminTransactions from '@/pages/admin/AdminTransactions'
import AdminKyc from '@/pages/admin/AdminKyc'
import AdminPayments from '@/pages/admin/AdminPayments'
import AdminCards from '@/pages/admin/AdminCards'
import AdminAuditLogs from '@/pages/admin/AdminAuditLogs'
import AdminSystemHealth from '@/pages/admin/AdminSystemHealth'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 15_000,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                <Route element={<AuthLayout />}>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                </Route>

                <Route
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/accounts" element={<Accounts />} />
                  <Route path="/transactions" element={<Transactions />} />
                  <Route path="/payments" element={<Payments />} />
                  <Route path="/beneficiaries" element={<Beneficiaries />} />
                  <Route path="/cards" element={<Cards />} />
                  <Route path="/kyc" element={<Kyc />} />
                  <Route path="/budgets" element={<Budgets />} />
                  <Route path="/savings" element={<Savings />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/settings" element={<Settings />} />

                  <Route
                    path="/admin"
                    element={
                      <AdminRoute>
                        <AdminLayout />
                      </AdminRoute>
                    }
                  >
                    <Route index element={<AdminDashboard />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="transactions" element={<AdminTransactions />} />
                    <Route path="kyc" element={<AdminKyc />} />
                    <Route path="payments" element={<AdminPayments />} />
                    <Route path="cards" element={<AdminCards />} />
                    <Route path="audit-logs" element={<AdminAuditLogs />} />
                    <Route path="system-health" element={<AdminSystemHealth />} />
                  </Route>
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
