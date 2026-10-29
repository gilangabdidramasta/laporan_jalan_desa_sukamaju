import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { RequireAuth } from './components/RequireAuth'
import { EditReportPage } from './pages/EditReportPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { MyReportsPage } from './pages/MyReportsPage'
import { NewReportPage } from './pages/NewReportPage'
import { NewsDetailPage } from './pages/NewsDetailPage'
import { NewsListPage } from './pages/NewsListPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ProfilePage } from './pages/ProfilePage'
import { RegisterPage } from './pages/RegisterPage'
import { ReportDetailPage } from './pages/ReportDetailPage'
import { ReportsPage } from './pages/ReportsPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="berita" element={<NewsListPage />} />
        <Route path="berita/:slug" element={<NewsDetailPage />} />
        <Route path="profil" element={<ProfilePage />} />

        <Route path="laporan" element={<ReportsPage />} />
        <Route
          path="laporan/baru"
          element={
            <RequireAuth>
              <NewReportPage />
            </RequireAuth>
          }
        />
        <Route
          path="laporan/saya"
          element={
            <RequireAuth>
              <MyReportsPage />
            </RequireAuth>
          }
        />
        <Route
          path="laporan/:ticketCode/edit"
          element={
            <RequireAuth>
              <EditReportPage />
            </RequireAuth>
          }
        />
        <Route path="laporan/:ticketCode" element={<ReportDetailPage />} />

        <Route path="masuk" element={<LoginPage />} />
        <Route path="daftar" element={<RegisterPage />} />

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
