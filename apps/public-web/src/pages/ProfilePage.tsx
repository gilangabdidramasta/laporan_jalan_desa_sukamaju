import { Link } from 'react-router-dom'
import { PROFILE, VILLAGE } from '../lib/village'
import { usePageTitle } from '../lib/usePageTitle'

const SECTIONS = [
  { id: 'sambutan', label: 'Sambutan Walikota', icon: 'person_outline' },
  { id: 'sejarah', label: 'Sejarah & Ringkasan', icon: 'history_edu' },
  { id: 'kontak', label: 'Kontak & Layanan', icon: 'contact_phone' },
]

export function ProfilePage() {
  usePageTitle('Profil Pemerintah Kota')

  return (
    <div className="flex flex-col w-full">
      <section className="w-full bg-surface-dark text-on-primary py-space-xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="civic-grid" height="48" width="48" patternUnits="userSpaceOnUse">
                <path d="M 48 0 L 0 0 0 48" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <rect fill="url(#civic-grid)" height="100%" width="100%" />
          </svg>
        </div>
        <div className="max-w-7xl mx-auto px-margin lg:px-margin-desktop relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-space-sm mb-space-md">
            <nav className="flex items-center gap-space-xs font-caption text-caption text-on-primary/80">
              <Link to="/" className="hover:text-on-primary transition-colors flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">home</span>
                Beranda
              </Link>
              <span>/</span>
              <span className="text-primary-fixed font-semibold">Profil Kota</span>
            </nav>
          </div>
          <div className="max-w-3xl">
            <h1 className="font-heading text-headline-lg-mobile md:text-headline-lg text-on-primary tracking-tight mb-space-xs font-bold">
              Profil {VILLAGE.nama}
            </h1>
            <p className="font-body-lg text-body-lg text-on-primary/85 leading-relaxed">
              {VILLAGE.nama} — Provinsi {VILLAGE.provinsi}
            </p>
            <p className="font-body-sm text-body-sm text-on-primary/70 mt-space-xs">
              Mewujudkan tata kelola kota yang partisipatif, transparan, dan
              berkeadilan dalam pembangunan infrastruktur jalan untuk seluruh warga.
            </p>
          </div>
        </div>
      </section>

      <div className="w-full max-w-7xl mx-auto px-margin lg:px-margin-desktop mt-space-lg pb-space-xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
          <aside className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-24 z-20">
            <div className="bg-surface-container-lowest rounded-xl shadow-card overflow-hidden">
              <div className="bg-surface-container-low p-space-md">
                <div className="flex items-center gap-2 text-primary font-bold font-title text-title">
                  <span className="material-symbols-outlined">menu_book</span>
                  Daftar Informasi
                </div>
                <p className="font-caption text-caption text-on-surface-variant mt-1">
                  Navigasi cepat isi profil kota
                </p>
              </div>
              <nav className="flex flex-col gap-1 text-on-surface p-space-sm">
                {SECTIONS.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="flex items-center gap-3 px-space-sm py-space-sm rounded-md hover:bg-primary-soft hover:text-primary transition-colors font-label-md text-label-md group"
                  >
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant group-hover:text-primary">
                      {section.icon}
                    </span>
                    <span>{section.label}</span>
                  </a>
                ))}
              </nav>
            </div>

            <div className="mt-space-md bg-primary-soft rounded-xl p-space-md">
              <div className="flex items-center gap-2 text-primary font-title text-title font-bold">
                <span className="material-symbols-outlined text-[20px]">campaign</span>
                Punya Aspirasi Jalan?
              </div>
              <p className="font-body-sm text-body-sm text-surface-dark/90 leading-relaxed mt-1">
                Laporkan kerusakan jalan di sekitar Anda agar tercatat dalam data
                infrastruktur Kota Pekanbaru.
              </p>
              <Link
                to="/laporan/baru"
                className="mt-space-sm inline-flex items-center justify-center gap-2 w-full min-h-[44px] rounded-md bg-primary text-on-primary font-label-md text-label-md font-bold hover:bg-primary-hover transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                Buat Laporan
              </Link>
            </div>
          </aside>

          <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-space-lg">
            <section
              id="sambutan"
              className="bg-surface-container-lowest rounded-xl shadow-card p-space-lg scroll-mt-24"
            >
              <div className="flex flex-col sm:flex-row gap-space-md">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden shrink-0 bg-primary-soft">
                  <img
                    src="/images/walikota.jpg"
                    alt={`Foto ${PROFILE.walikota.nama}, ${PROFILE.walikota.jabatan}`}
                    className="w-full h-full object-cover object-top"
                    loading="lazy"
                  />
                </div>
                <div className="flex flex-col gap-space-xs">
                  <h2 className="font-heading text-headline-sm text-on-surface font-bold">
                    Sambutan Walikota
                  </h2>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                    {PROFILE.sambutan}
                  </p>
                  <div className="flex flex-col">
                    <span className="font-title text-title text-on-surface font-bold">
                      {PROFILE.walikota.nama}
                    </span>
                    <span className="font-caption text-caption text-on-surface-variant">
                      {PROFILE.walikota.jabatan}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section
              id="sejarah"
              className="bg-surface-container-lowest rounded-xl shadow-card p-space-lg scroll-mt-24"
            >
              <h2 className="font-heading text-headline-sm text-on-surface font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">
                  history_edu
                </span>
                Sejarah &amp; Ringkasan Kota
              </h2>
              <div className="mt-space-sm flex flex-col gap-space-sm">
                {PROFILE.sejarah.map((paragraph, index) => (
                  <p
                    key={index}
                    className="font-body-md text-body-md text-on-surface-variant leading-relaxed"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>

            <section
              id="kontak"
              className="bg-surface-container-lowest rounded-xl shadow-card p-space-lg scroll-mt-24"
            >
              <h2 className="font-heading text-headline-sm text-on-surface font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">
                  contact_phone
                </span>
                Kontak &amp; Layanan
              </h2>
              <div className="mt-space-md grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
                <div className="bg-surface-container-low rounded-lg p-space-sm flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary text-[22px]">place</span>
                  <div>
                    <p className="font-label-md text-label-md text-on-surface font-bold">Alamat</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      {VILLAGE.alamatKantor}
                    </p>
                  </div>
                </div>
                <div className="bg-surface-container-low rounded-lg p-space-sm flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary text-[22px]">call</span>
                  <div>
                    <p className="font-label-md text-label-md text-on-surface font-bold">
                      Telepon
                    </p>
                    <a
                      href={`tel:${VILLAGE.teleponHref}`}
                      className="font-body-sm text-body-sm text-primary hover:underline tabular-nums"
                    >
                      {VILLAGE.telepon}
                    </a>
                  </div>
                </div>
                <div className="bg-surface-container-low rounded-lg p-space-sm flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary text-[22px]">mail</span>
                  <div>
                    <p className="font-label-md text-label-md text-on-surface font-bold">Email</p>
                    <a
                      href={`mailto:${VILLAGE.email}`}
                      className="font-body-sm text-body-sm text-primary hover:underline break-all"
                    >
                      {VILLAGE.email}
                    </a>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
