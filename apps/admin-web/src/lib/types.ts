export type DamageType =
  | 'LUBANG'
  | 'RETAK'
  | 'AMBLAS'
  | 'BERGELOMBANG'
  | 'MENGELUPAS'
  | 'TERGENANG'

export type ReportStatus =
  | 'PENDING'
  | 'PROSES'
  | 'DIPERBAIKI'
  | 'DITOLAK'
  | 'DITARIK'

export interface DamageTypeMeta {
  value: DamageType
  label: string
  description: string
}

export const DAMAGE_TYPES: DamageTypeMeta[] = [
  {
    value: 'LUBANG',
    label: 'Lubang',
    description: 'Cekungan pada permukaan jalan yang menahan air',
  },
  {
    value: 'RETAK',
    label: 'Retak',
    description: 'Garis pecah pada aspal atau beton, memanjang maupun melintang',
  },
  {
    value: 'AMBLAS',
    label: 'Amblas',
    description: 'Bagian jalan yang turun atau tertekan ke bawah',
  },
  {
    value: 'BERGELOMBANG',
    label: 'Bergelombang',
    description: 'Permukaan jalan tidak rata dan bergelombang',
  },
  {
    value: 'MENGELUPAS',
    label: 'Mengelupas',
    description: 'Lapisan permukaan jalan terkelupas sehingga agregat terlihat',
  },
  {
    value: 'TERGENANG',
    label: 'Tergenang',
    description: 'Air menggenang di atas jalan karena drainase tidak berfungsi',
  },
]

export const DAMAGE_LABEL: Record<DamageType, string> = DAMAGE_TYPES.reduce(
  (acc, item) => ({ ...acc, [item.value]: item.label }),
  {} as Record<DamageType, string>,
)

export interface ReportStatusMeta {
  value: ReportStatus
  label: string
  shortLabel: string
  icon: string
}

export const REPORT_STATUSES: ReportStatusMeta[] = [
  {
    value: 'PENDING',
    label: 'Menunggu Verifikasi',
    shortLabel: 'Menunggu',
    icon: 'schedule',
  },
  {
    value: 'PROSES',
    label: 'Sedang Diproses',
    shortLabel: 'Proses',
    icon: 'construction',
  },
  {
    value: 'DIPERBAIKI',
    label: 'Selesai Diperbaiki',
    shortLabel: 'Diperbaiki',
    icon: 'check_circle',
  },
  {
    value: 'DITOLAK',
    label: 'Ditolak',
    shortLabel: 'Ditolak',
    icon: 'cancel',
  },
  {
    value: 'DITARIK',
    label: 'Ditarik',
    shortLabel: 'Ditarik',
    icon: 'undo',
  },
]

export const STATUS_LABEL: Record<ReportStatus, string> = REPORT_STATUSES.reduce(
  (acc, item) => ({ ...acc, [item.value]: item.label }),
  {} as Record<ReportStatus, string>,
)

export type AdminRole = 'ADMIN' | 'SUPER_ADMIN'
export type AccountStatus = 'AKTIF' | 'NONAKTIF'

export const ROLE_LABEL: Record<AdminRole, string> = {
  ADMIN: 'Admin',
  SUPER_ADMIN: 'Super Admin',
}

export interface Admin {
  id: number
  nama: string
  email: string
  password?: string
  role: AdminRole
  status: AccountStatus
  createdAt: string
  lastLoginAt?: string
}

export interface Citizen {
  id: number
  nama: string
  email: string
  noWa: string
  password?: string
  status: AccountStatus
  createdAt: string
}

export interface Report {
  id: number
  ticketCode: string
  citizenId: number
  alamat: string
  latitude: number
  longitude: number
  deskripsi: string
  damageTypes: DamageType[]
  photos: string[]
  repairPhotos: string[]
  status: ReportStatus
  rejectionReason?: string
  createdAt: string
  updatedAt: string
}

export type ReportAction =
  | 'DIBUAT'
  | 'SETUJUI'
  | 'TOLAK'
  | 'TARIK'
  | 'PUBLIKASI_ULANG'
  | 'SETUJUI_ULANG'
  | 'SELESAI'
  | 'EDIT'
  | 'HAPUS'

export const ACTION_LABEL: Record<ReportAction, string> = {
  DIBUAT: 'Laporan dikirim warga',
  SETUJUI: 'Laporan disetujui',
  TOLAK: 'Laporan ditolak',
  TARIK: 'Laporan ditarik',
  PUBLIKASI_ULANG: 'Laporan dipublikasikan ulang',
  SETUJUI_ULANG: 'Laporan disetujui ulang',
  SELESAI: 'Perbaikan jalan selesai',
  EDIT: 'Data laporan diperbarui',
  HAPUS: 'Laporan dihapus permanen',
}

export interface ReportLog {
  id: number
  reportId: number
  actorNama: string
  actorRole: AdminRole | 'SISTEM'
  action: ReportAction
  fromStatus: ReportStatus | null
  toStatus: ReportStatus | null
  note?: string
  changes?: Record<string, { from: string; to: string }>
  createdAt: string
}

export type NewsStatus = 'DRAFT' | 'TERBIT'

export interface NewsItem {
  id: number
  slug: string
  judul: string
  ringkasan: string
  isi: string
  cover: string
  status: NewsStatus
  authorNama: string
  createdAt: string
  updatedAt: string
  publishedAt: string | null
}

export interface ReportEditDraft {
  photos: string[]
  alamat: string
  latitude: number | null
  longitude: number | null
  damageTypes: DamageType[]
  deskripsi: string
  note: string
}
