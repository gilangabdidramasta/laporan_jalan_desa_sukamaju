import { useEffect } from 'react'

export function usePageTitle(title?: string) {
  useEffect(() => {
    const base = 'Lapor Jalan Kota Pekanbaru'
    document.title = title ? `${title} - Kota Pekanbaru` : base
    return () => {
      document.title = base
    }
  }, [title])
}
