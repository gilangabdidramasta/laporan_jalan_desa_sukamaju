import { ApiError, api, setToken, toQuery } from './api'
import type { DamageType, NewsItem, Report, ReportDraft, ReportStatus } from './types'

const KEY_SESSION = 'lapor.session.v1'

/** Kode tiket dinormalisasi tanpa awalan # agar URL tetap bersih */
export function normalizeTicket(code: string): string {
  return decodeURIComponent(code).replace(/^#/, '').toUpperCase()
}

/* --------------------------------- Laporan -------------------------------- */

export interface PublicReportFilters {
  damageTypes?: DamageType[]
  status?: 'PROSES' | 'DIPERBAIKI'
  ticket?: string
  page?: number
  perPage?: number
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

export interface PublicReport extends Report {
  reporterNama: string
}

export async function fetchPublicReports(
  filters: PublicReportFilters = {},
): Promise<Paginated<PublicReport>> {
  const { damageTypes = [], status = '', ticket = '', page = 1, perPage = 9 } = filters
  return api<Paginated<PublicReport>>(
    `/reports${toQuery({
      damageTypes: damageTypes.join(','),
      status,
      ticket: ticket.trim(),
      page,
      perPage,
    })}`,
    { auth: false },
  )
}

export async function fetchPublicStats() {
  return api<{
    totalReports: number
    damageTypeCount: number
    lastUpdated: string | null
  }>('/reports/stats', { auth: false })
}

export async function fetchReportByTicket(
  ticketCode: string,
): Promise<PublicReport | null> {
  try {
    const data = await api<{ report: PublicReport }>(
      `/reports/ticket/${encodeURIComponent(normalizeTicket(ticketCode))}`,
      { auth: false },
    )
    return data.report
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

export async function fetchReportStatusByTicket(
  ticketCode: string,
): Promise<ReportStatus | null> {
  const report = await fetchReportByTicket(ticketCode)
  return report ? report.status : null
}

export async function fetchMyReports(citizenId: number): Promise<Report[]> {
  void citizenId
  const data = await api<{ items: Report[] }>('/reports/mine')
  return data.items
}

export async function fetchMyReport(
  reportId: number,
  citizenId: number,
): Promise<Report | null> {
  void citizenId
  try {
    const data = await api<{ report: Report }>(`/reports/${reportId}`)
    return data.report
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

export async function createReport(
  citizenId: number,
  draft: ReportDraft,
): Promise<Report> {
  void citizenId
  const data = await api<{ report: Report }>('/reports', {
    method: 'POST',
    body: {
      alamat: draft.alamat,
      latitude: draft.latitude,
      longitude: draft.longitude,
      deskripsi: draft.deskripsi,
      damageTypes: draft.damageTypes,
      photos: draft.photos,
    },
  })
  return data.report
}

export async function updateReport(
  reportId: number,
  citizenId: number,
  draft: ReportDraft,
): Promise<Report> {
  void citizenId
  const data = await api<{ report: Report }>(`/reports/${reportId}`, {
    method: 'PUT',
    body: {
      alamat: draft.alamat,
      latitude: draft.latitude,
      longitude: draft.longitude,
      deskripsi: draft.deskripsi,
      damageTypes: draft.damageTypes,
      photos: draft.photos,
    },
  })
  return data.report
}

export async function countTodayReports(citizenId: number): Promise<number> {
  void citizenId
  const data = await api<{ count: number }>('/reports/today-count')
  return data.count
}

/* ---------------------------------- Berita -------------------------------- */

export async function fetchNewsList(): Promise<NewsItem[]> {
  const data = await api<{ items: NewsItem[] }>('/news', { auth: false })
  return data.items
}

export async function fetchNewsBySlug(slug: string): Promise<NewsItem | null> {
  try {
    const data = await api<{ item: NewsItem }>(
      `/news/${encodeURIComponent(slug)}`,
      { auth: false },
    )
    return data.item
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

/* ---------------------------------- Akun ---------------------------------- */

export interface SessionUser {
  id: number
  nama: string
  email: string
  noWa: string
}

export function getSession(): SessionUser | null {
  try {
    const raw = localStorage.getItem(KEY_SESSION)
    return raw ? (JSON.parse(raw) as SessionUser) : null
  } catch {
    return null
  }
}

export function setSession(user: SessionUser | null) {
  try {
    if (user) localStorage.setItem(KEY_SESSION, JSON.stringify(user))
    else {
      localStorage.removeItem(KEY_SESSION)
      setToken(null)
    }
  } catch {
    /* penyimpanan tidak tersedia */
  }
}

export async function login(
  email: string,
  password: string,
): Promise<SessionUser> {
  const data = await api<{ token: string; user: SessionUser }>('/auth/login', {
    method: 'POST',
    auth: false,
    body: { email: email.trim(), password },
  })
  setToken(data.token)
  return data.user
}

export interface RegisterInput {
  nama: string
  email: string
  noWa: string
  password: string
}

export async function register(input: RegisterInput): Promise<SessionUser> {
  const data = await api<{ token: string; user: SessionUser }>('/auth/register', {
    method: 'POST',
    auth: false,
    body: {
      nama: input.nama.trim(),
      email: input.email.trim(),
      noWa: input.noWa.trim(),
      password: input.password,
    },
  })
  setToken(data.token)
  return data.user
}
