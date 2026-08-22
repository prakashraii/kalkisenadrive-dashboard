import { Navigate, Route, Routes } from 'react-router-dom'
import { DashboardLayout } from './layouts/DashboardLayout'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { UsersPage } from './pages/UsersPage'
import { DonationsPage } from './pages/DonationsPage'
import { MembershipsPage } from './pages/MembershipsPage'
import { ClinicsPage } from './pages/ClinicsPage'
import { DriversPage } from './pages/DriversPage'
import { BooksPage } from './pages/BooksPage'
import { BookOrdersPage } from './pages/BookOrdersPage'
import { VideosPage } from './pages/VideosPage'
import { PaymentsPage } from './pages/PaymentsPage'
import { NotificationsPage } from './pages/NotificationsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<DashboardLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/donations" element={<DonationsPage />} />
        <Route path="/memberships" element={<MembershipsPage />} />
        <Route path="/clinics" element={<ClinicsPage />} />
        <Route path="/drivers" element={<DriversPage />} />
        <Route path="/books" element={<BooksPage />} />
        <Route path="/books/orders" element={<BookOrdersPage />} />
        <Route path="/videos" element={<VideosPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
