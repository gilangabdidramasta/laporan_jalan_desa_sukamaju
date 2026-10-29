import { ApiError, api, setToken, toQuery } from './api'
import type {
  AccountStatus,
  Admin,
  AdminRole,
  Citizen,
  DamageType,
  NewsItem,
  NewsStatus,
  Report,
  ReportAction,
  ReportEditDraft,
  ReportLog,
  ReportStatus,
} from './types'

export class AuthError extends Error {
  code: 'INVALID' | 'INACTIVE' | 'LOCKED'

  constructor(code: 'INVALID' | 'INACTIVE' | 'LOCKED', message: string) {
    super(message)
    this.name = 'AuthError'
    this.code = code
  }
}

/* --------------------------------- Login ---------------------------------- */

const AUTH_CODE_BY_STATUS: Record<number, AuthError['code']> = {
  401: 'INVALID',
  403: 'INACTIVE',
  429: 'LOCKED',
}

export async function loginAdmin(
  email: string,
  password: string,
): Promise<Admin> {
  try {
    const data = await api<{ token: string; admin: Admin }>('/login', {
      method: 'POST',
      auth: false,
      body: { email: email.trim(), password },
    })
    setToken(data.token)
    return data.admin
  } catch (error) {
    if (error instanceof ApiError) {
      const code = AUTH_CODE_BY_STATUS[error.status] ?? 'INVALID'
      throw new AuthError(code, error.message)
    }
    throw error
  }
}

export function logoutAdmin() {
  setToken(null)
}

/* --------------------------------- Laporan -------------------------------- */

export interface AdminReport extends Report {
  reporter: Citizen | null
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

export interface ReportFilters {
  status?: ReportStatus | 'ALL'
  q?: string
  damageTypes?: DamageType[]
  from?: string
  to?: string
  page?: number
  perPage?: number
}

export async function fetchReportStats(): Promise<Record<ReportStatus, number>> {
  const data = await api<{ stats: Record<ReportStatus, number> }>('/reports/stats')
  return data.stats
}

export async function fetchPendingCount(): Promise<number> {
  const data = await api<{ count: number }>('/reports/pending-count')
  return data.count
}

export async function fetchReports(
  filters: ReportFilters = {},
): Promise<Paginated<AdminReport>> {
  const {
    status = 'ALL',
    q = '',
    damageTypes = [],
    from,
    to,
    page = 1,
    perPage = 20,
  } = filters

  return api<Paginated<AdminReport>>(
    `/reports${toQuery({
      status,
      q: q.trim(),
      damageTypes: damageTypes.join(','),
      from,
      to,
      page,
      perPage,
    })}`,
  )
}

export async function fetchReportById(id: number): Promise<{
  report: AdminReport
  logs: ReportLog[]
} | null> {
  try {
    return await api<{ report: AdminReport; logs: ReportLog[] }>(`/reports/${id}`)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

export async function approveReport(id: number, actor: Admin, note?: string) {
  void actor
  await api(`/reports/${id}/approve`, { method: 'POST', body: { note } })
}

export async function completeReport(
  id: number,
  actor: Admin,
  photos: string[],
  note?: string,
) {
  void actor
  await api(`/reports/${id}/complete`, {
    method: 'POST',
    body: { photos, note },
  })
}

export async function rejectReport(
  id: number,
  actor: Admin,
  reason: string,
  note?: string,
) {
  void actor
  await api(`/reports/${id}/reject`, {
    method: 'POST',
    body: { reason, note },
  })
}

export async function withdrawReport(id: number, actor: Admin, note?: string) {
  void actor
  await api(`/reports/${id}/withdraw`, { method: 'POST', body: { note } })
}

export async function republishReport(id: number, actor: Admin, note?: string) {
  void actor
  await api(`/reports/${id}/republish`, { method: 'POST', body: { note } })
}

export async function updateReport(
  id: number,
  actor: Admin,
  draft: ReportEditDraft,
) {
  void actor
  await api<{ report: Report }>(`/reports/${id}`, {
    method: 'PUT',
    body: {
      alamat: draft.alamat,
      latitude: draft.latitude,
      longitude: draft.longitude,
      damageTypes: draft.damageTypes,
      deskripsi: draft.deskripsi,
      photos: draft.photos,
      note: draft.note,
    },
  })
}

export async function deleteReport(id: number, actor: Admin) {
  void actor
  await api(`/reports/${id}`, { method: 'DELETE' })
}

/* --------------------------------- Warga ---------------------------------- */

export interface CitizenRow extends Citizen {
  reportCount: number
}

export interface CitizenFilters {
  q?: string
  status?: AccountStatus | 'ALL'
  page?: number
  perPage?: number
}

export async function fetchCitizens(
  filters: CitizenFilters = {},
): Promise<Paginated<CitizenRow>> {
  const { q = '', status = 'ALL', page = 1, perPage = 20 } = filters
  return api<Paginated<CitizenRow>>(
    `/citizens${toQuery({ q: q.trim(), status, page, perPage })}`,
  )
}

export async function fetchCitizenStats(): Promise<{
  total: number
  aktif: number
  nonaktif: number
}> {
  return api('/citizens/stats')
}

export async function fetchCitizenById(id: number): Promise<{
  citizen: Citizen
  reports: Report[]
} | null> {
  try {
    return await api<{ citizen: Citizen; reports: Report[] }>(`/citizens/${id}`)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

export async function setCitizenStatus(id: number, status: AccountStatus) {
  await api(`/citizens/${id}/status`, { method: 'PATCH', body: { status } })
}

export async function resetCitizenPassword(id: number): Promise<string> {
  const data = await api<{ password: string }>(`/citizens/${id}/reset-password`, {
    method: 'POST',
  })
  return data.password
}

/* --------------------------------- Admin ---------------------------------- */

export interface AdminFilters {
  q?: string
  role?: AdminRole | 'ALL'
  page?: number
  perPage?: number
}

export async function fetchAdmins(
  filters: AdminFilters = {},
): Promise<Paginated<Admin>> {
  const { q = '', role = 'ALL', page = 1, perPage = 20 } = filters
  return api<Paginated<Admin>>(
    `/admins${toQuery({ q: q.trim(), role, page, perPage })}`,
  )
}

export interface CreateAdminInput {
  nama: string
  email: string
  password: string
  role: AdminRole
}

export async function createAdmin(input: CreateAdminInput): Promise<Admin> {
  const data = await api<{ admin: Admin }>('/admins', {
    method: 'POST',
    body: {
      nama: input.nama.trim(),
      email: input.email.trim().toLowerCase(),
      password: input.password,
      role: input.role,
    },
  })
  return data.admin
}

export async function setAdminStatus(id: number, status: AccountStatus) {
  await api(`/admins/${id}/status`, { method: 'PATCH', body: { status } })
}

export async function resetAdminPassword(id: number): Promise<string> {
  const data = await api<{ password: string }>(`/admins/${id}/reset-password`, {
    method: 'POST',
  })
  return data.password
}

/* --------------------------------- Berita --------------------------------- */

export interface NewsFilters {
  q?: string
  status?: NewsStatus | 'ALL'
  page?: number
  perPage?: number
}

export async function fetchNewsList(
  filters: NewsFilters = {},
): Promise<Paginated<NewsItem>> {
  const { q = '', status = 'ALL', page = 1, perPage = 20 } = filters
  return api<Paginated<NewsItem>>(
    `/news${toQuery({ q: q.trim(), status, page, perPage })}`,
  )
}

export async function fetchNewsById(id: number): Promise<NewsItem | null> {
  try {
    const data = await api<{ item: NewsItem }>(`/news/${id}`)
    return data.item
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

export interface NewsInput {
  judul: string
  slug: string
  ringkasan: string
  isi: string
  cover: string
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function checkSlug(slug: string, exceptId?: number): Promise<boolean> {
  const data = await api<{ taken: boolean }>(
    `/news/slug-check${toQuery({ slug, exceptId })}`,
  )
  return data.taken
}

export async function uniqueSlug(base: string, exceptId?: number) {
  const data = await api<{ slug: string }>(
    `/news/unique-slug${toQuery({ base, exceptId })}`,
  )
  return data.slug
}

export async function saveNews(
  input: NewsInput,
  actor: Admin,
  status: NewsStatus,
  id?: number,
): Promise<NewsItem> {
  void actor
  const data = id
    ? await api<{ item: NewsItem }>(`/news/${id}`, {
        method: 'PUT',
        body: { ...input, status },
      })
    : await api<{ item: NewsItem }>('/news', {
        method: 'POST',
        body: { ...input, status },
      })
  return data.item
}

export async function deleteNews(id: number) {
  await api(`/news/${id}`, { method: 'DELETE' })
}

export async function unpublishNews(id: number) {
  await api(`/news/${id}/unpublish`, { method: 'POST' })
}

/** Utilitas kecil untuk halaman berita: ringkasan otomatis dari isi teks. */
export function summarize(html: string, maxLength = 180): string {
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength).trimEnd()}…`
}

export type { ReportAction }
