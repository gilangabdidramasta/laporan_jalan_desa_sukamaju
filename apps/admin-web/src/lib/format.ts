const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
]

const MONTHS_LONG = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
]

export function formatDate(iso: string): string {
  const date = new Date(iso)
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`
}

export function formatDateLong(iso: string): string {
  const date = new Date(iso)
  return `${date.getDate()} ${MONTHS_LONG[date.getMonth()]} ${date.getFullYear()}`
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${formatDate(iso)}, ${hours}.${minutes}`
}

export function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'baru saja'
  if (minutes < 60) return `${minutes} menit lalu`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} jam lalu`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} hari lalu`
  return formatDate(iso)
}

export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ')
}

export function formatCoordinate(value: number): string {
  return value.toFixed(6)
}

/** Kode tiket disimpan tanpa tanda pagar; tampilkan dengan awalan # */
export function formatTicket(code: string): string {
  return code.startsWith('#') ? code : `#${code}`
}

export function normalizePhone(value: string): string {
  return value.replace(/[^\d+]/g, '')
}

/** Mengubah nomor lokal 08xx menjadi tautan wa.me */
export function waLink(value: string): string {
  const digits = value.replace(/\D/g, '')
  const international = digits.startsWith('0')
    ? `62${digits.slice(1)}`
    : digits
  return `https://wa.me/${international}`
}
