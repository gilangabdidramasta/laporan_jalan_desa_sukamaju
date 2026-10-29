export const VILLAGE = {
  nama: 'Kota Pekanbaru',
  namaPendek: 'Pekanbaru',
  provinsi: 'Riau',
  alamatKantor: 'Jl. Jend. Sudirman No. 460, Kota Pekanbaru, Riau',
  telepon: '(0761) 123-4567',
  teleponHref: '+627611234567',
  email: 'laporjalan@pekanbaru.go.id',
  // Titik pusat peta (pusat Kota Pekanbaru)
  center: { lat: 0.5071, lng: 101.4478 },
  zoom: 13,
} as const

export const PROFILE = {
  sambutan:
    'Kota Pekanbaru adalah pusat pemerintahan dan perekonomian Provinsi Riau yang tumbuh bersama semangat gotong royong dan keterbukaan. Kami membangun infrastruktur jalan yang aman, merata, dan berkelanjutan untuk seluruh warga.',
  walikota: {
    nama: 'H. Agung Nugroho, S.E., M.M',
    jabatan: 'Walikota Pekanbaru',
  },
  sejarah: [
    'Kota Pekanbaru tumbuh dari permukiman di tepi Sungai Siak menjadi pusat perdagangan, jasa, dan pemerintahan Provinsi Riau.',
    'Seiring pertumbuhan kota, jaringan jalan menjadi penghubung utama antarkecamatan, kawasan permukiman, pusat ekonomi, dan fasilitas publik. Pemeliharaan jalan menjadi bagian penting dari pelayanan kota.',
    'Melalui sistem pelaporan ini, Pemerintah Kota Pekanbaru menata data kerusakan jalan secara digital agar penanganan dapat diprioritaskan berdasarkan kondisi nyata di lapangan.',
  ],
} as const
