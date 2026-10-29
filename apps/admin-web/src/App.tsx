import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminLayout } from './components/AdminLayout'
import { RequireAdmin, RequireAuth, RequireSuperAdmin } from './components/RequireAuth'
import { AdminNewPage } from './pages/AdminNewPage'
import { AdminsListPage } from './pages/AdminsListPage'
import { CitizenDetailPage } from './pages/CitizenDetailPage'
import { CitizensListPage } from './pages/CitizensListPage'
import { ForbiddenPage } from './pages/ForbiddenPage'
import { LoginPage } from './pages/LoginPage'
import { NewsFormPage } from './pages/NewsFormPage'
import { NewsListPage } from './pages/NewsListPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ReportDetailPage } from './pages/ReportDetailPage'
import { ReportEditPage } from './pages/ReportEditPage'
import { ReportsListPage } from './pages/ReportsListPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<RequireAuth />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="/laporan" replace />} />

          <Route path="laporan" element={<ReportsListPage />} />
          <Route path="laporan/:id" element={<ReportDetailPage />} />
          <Route element={<RequireAdmin />}>
            <Route path="laporan/:id/edit" element={<ReportEditPage />} />
          </Route>

          <Route path="berita" element={<NewsListPage />} />
          <Route element={<RequireAdmin />}>
            <Route path="berita/baru" element={<NewsFormPage />} />
            <Route path="berita/:id/edit" element={<NewsFormPage />} />
          </Route>

          <Route path="akun-warga" element={<CitizensListPage />} />
          <Route path="akun-warga/:id" element={<CitizenDetailPage />} />

          <Route element={<RequireSuperAdmin />}>
            <Route path="akun-admin" element={<AdminsListPage />} />
            <Route path="akun-admin/baru" element={<AdminNewPage />} />
          </Route>

          <Route path="403" element={<ForbiddenPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
