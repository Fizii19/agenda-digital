export type {
    User, Kelas, Guru, Siswa, MataPelajaran,
    Jadwal, Agenda, Presensi, DashboardStats
  } from './types';
  
  import {
    User, Kelas, Guru, Siswa, MataPelajaran,
    Jadwal, Agenda, Presensi, DashboardStats
  } from './types';
  
  export const users: User[] = [
    { id: '1', name: 'Admin Sekolah', email: 'admin@sekolah.id', nip: '12345678', role: 'admin' },
    { id: '2', name: 'Siti Aminah', email: 'sekretaris@sekolah.id', nip: '22334455', role: 'sekretaris' },
    { id: '3', name: 'Budi Santoso', email: 'walikelas@sekolah.id', nip: '198501012010011001', role: 'walikelas', kelas: 'XII IPA 1' },
    { id: '4', name: 'Dr. H. Ahmad Riza', email: 'pimpinan@sekolah.id', nip: '11223344', role: 'pimpinan' },
    { id: '5', name: 'Dina Permata', email: 'siswa@sekolah.id', nis: '2024001', role: 'siswa', kelas: 'XII IPA 1' },
    { id: '6', name: 'Dewi Lestari', email: 'guru@sekolah.id', nip: '198602022011012002', role: 'guru' },
  ];
  
  export const kelasList: Kelas[] = [
    { id: '1', nama: 'XII IPA 1', tingkat: 12, jurusan: 'IPA', waliKelas: 'Budi Santoso', jumlahSiswa: 36, tahunAjaran: '2025/2026' },
    { id: '2', nama: 'XII IPA 2', tingkat: 12, jurusan: 'IPA', waliKelas: 'Dewi Lestari', jumlahSiswa: 34, tahunAjaran: '2025/2026' },
    { id: '3', nama: 'XII IPS 1', tingkat: 12, jurusan: 'IPS', waliKelas: 'Rudi Hartono', jumlahSiswa: 38, tahunAjaran: '2025/2026' },
    { id: '4', nama: 'XI IPA 1', tingkat: 11, jurusan: 'IPA', waliKelas: 'Sari Indah', jumlahSiswa: 35, tahunAjaran: '2025/2026' },
    { id: '5', nama: 'XI IPS 1', tingkat: 11, jurusan: 'IPS', waliKelas: 'Agus Prasetyo', jumlahSiswa: 37, tahunAjaran: '2025/2026' },
    { id: '6', nama: 'X IPA 1', tingkat: 10, jurusan: 'IPA', waliKelas: 'Nina Rahayu', jumlahSiswa: 40, tahunAjaran: '2025/2026' },
    { id: '7', nama: 'X IPS 1', tingkat: 10, jurusan: 'IPS', waliKelas: 'Dodi Hermawan', jumlahSiswa: 39, tahunAjaran: '2025/2026' },
    { id: '8', nama: 'XII IPA 3', tingkat: 12, jurusan: 'IPA', waliKelas: 'Rina Fitriani', jumlahSiswa: 32, tahunAjaran: '2025/2026' },
  ];
  
  export const guruList: Guru[] = [
    { id: '1', nip: '198501012010011001', nama: 'Budi Santoso', email: 'budi@sekolah.id', telepon: '081234567890', mataPelajaran: ['Matematika'], status: 'Aktif', alamat: 'Jl. Merdeka No. 1' },
    { id: '2', nip: '198602022011012002', nama: 'Dewi Lestari', email: 'dewi@sekolah.id', telepon: '081234567891', mataPelajaran: ['Fisika'], status: 'Aktif', alamat: 'Jl. Sudirman No. 2' },
    { id: '3', nip: '198703032012013003', nama: 'Rudi Hartono', email: 'rudi@sekolah.id', telepon: '081234567892', mataPelajaran: ['Ekonomi'], status: 'Aktif', alamat: 'Jl. Diponegoro No. 3' },
    { id: '4', nip: '198804042013014004', nama: 'Sari Indah', email: 'sari@sekolah.id', telepon: '081234567893', mataPelajaran: ['Kimia'], status: 'Aktif', alamat: 'Jl. Ahmad Yani No. 4' },
    { id: '5', nip: '198905052014015005', nama: 'Agus Prasetyo', email: 'agus@sekolah.id', telepon: '081234567894', mataPelajaran: ['Sosiologi'], status: 'Cuti', alamat: 'Jl. Gatot Subroto No. 5' },
    { id: '6', nip: '199006062015016006', nama: 'Nina Rahayu', email: 'nina@sekolah.id', telepon: '081234567895', mataPelajaran: ['Biologi'], status: 'Aktif', alamat: 'Jl. Thamrin No. 6' },
    { id: '7', nip: '199107072016017007', nama: 'Dodi Hermawan', email: 'dodi@sekolah.id', telepon: '081234567896', mataPelajaran: ['Geografi'], status: 'Aktif', alamat: 'Jl. Veteran No. 7' },
    { id: '8', nip: '199208082017018008', nama: 'Rina Fitriani', email: 'rina@sekolah.id', telepon: '081234567897', mataPelajaran: ['Bahasa Indonesia'], status: 'Aktif', alamat: 'Jl. Pemuda No. 8' },
  ];
  
  export const siswaList: Siswa[] = [
    { id: '1', nis: '2024001', nama: 'Dina Permata', kelas: 'XII IPA 1', email: 'dina@sekolah.id', telepon: '081345678901', alamat: 'Jl. Mawar No. 1', status: 'Aktif' },
    { id: '2', nis: '2024002', nama: 'Rizky Aditya', kelas: 'XII IPA 1', email: 'rizky@sekolah.id', telepon: '081345678902', alamat: 'Jl. Melati No. 2', status: 'Aktif' },
    { id: '3', nis: '2024003', nama: 'Ayu Lestari', kelas: 'XII IPA 2', email: 'ayu@sekolah.id', telepon: '081345678903', alamat: 'Jl. Anggrek No. 3', status: 'Aktif' },
    { id: '4', nis: '2024004', nama: 'Dimas Pratama', kelas: 'XII IPS 1', email: 'dimas@sekolah.id', telepon: '081345678904', alamat: 'Jl. Kenanga No. 4', status: 'Aktif' },
    { id: '5', nis: '2024005', nama: 'Sinta Dewi', kelas: 'XI IPA 1', email: 'sinta@sekolah.id', telepon: '081345678905', alamat: 'Jl. Dahlia No. 5', status: 'Aktif' },
  ];
  
  export const mapelList: MataPelajaran[] = [
    { id: '1', kode: 'MTK-12', nama: 'Matematika Peminatan', guru: 'Budi Santoso', tingkat: 12, jurusan: 'IPA', jamPerMinggu: 6 },
    { id: '2', kode: 'FIS-12', nama: 'Fisika', guru: 'Dewi Lestari', tingkat: 12, jurusan: 'IPA', jamPerMinggu: 5 },
    { id: '3', kode: 'EKO-12', nama: 'Ekonomi', guru: 'Rudi Hartono', tingkat: 12, jurusan: 'IPS', jamPerMinggu: 5 },
    { id: '4', kode: 'KIM-11', nama: 'Kimia', guru: 'Sari Indah', tingkat: 11, jurusan: 'IPA', jamPerMinggu: 5 },
    { id: '5', kode: 'BIO-11', nama: 'Biologi', guru: 'Nina Rahayu', tingkat: 11, jurusan: 'IPA', jamPerMinggu: 4 },
  ];
  
  export const jadwalList: Jadwal[] = [
    { id: '1', kelas: 'XII IPA 1', hari: 'Senin', jamMulai: '07:00', jamSelesai: '08:30', mataPelajaran: 'Matematika Peminatan', guru: 'Budi Santoso', ruangan: 'R-301' },
    { id: '2', kelas: 'XII IPA 1', hari: 'Senin', jamMulai: '08:45', jamSelesai: '10:15', mataPelajaran: 'Fisika', guru: 'Dewi Lestari', ruangan: 'R-302' },
    { id: '3', kelas: 'XII IPA 1', hari: 'Selasa', jamMulai: '07:00', jamSelesai: '08:30', mataPelajaran: 'Kimia', guru: 'Sari Indah', ruangan: 'LAB-KIM' },
    { id: '4', kelas: 'XII IPA 2', hari: 'Senin', jamMulai: '07:00', jamSelesai: '08:30', mataPelajaran: 'Fisika', guru: 'Dewi Lestari', ruangan: 'R-303' },
    { id: '5', kelas: 'XII IPS 1', hari: 'Senin', jamMulai: '07:00', jamSelesai: '08:30', mataPelajaran: 'Ekonomi', guru: 'Rudi Hartono', ruangan: 'R-304' },
  ];
  
  export const agendaList: Agenda[] = [
    {
      id: '1',
      kelas: 'XII IPA 1',
      tanggal: '2026-05-18',
      items: [
        { jamMulai: '06:30', jamSelesai: '07:15', kegiatan: 'Upacara Bendera', keterangan: 'Lapangan Utama' },
        { jamMulai: '07:15', jamSelesai: '09:30', kegiatan: 'PAI', keterangan: 'Bpk. Ahmad' },
        { jamMulai: '09:30', jamSelesai: '15:00', kegiatan: 'Web Development', keterangan: 'Lab Komputer' },
      ],
      createdBy: 'Siti Aminah',
      createdAt: '2026-05-17'
    },
    {
      id: '2',
      kelas: 'XII IPA 1',
      tanggal: '2026-05-19',
      items: [
        { jamMulai: '06:30', jamSelesai: '08:00', kegiatan: 'Literasi & Dhuha', keterangan: 'Masjid' },
        { jamMulai: '08:00', jamSelesai: '12:00', kegiatan: 'Mobile Programming', keterangan: 'Lab Komputer' },
        { jamMulai: '13:00', jamSelesai: '15:00', kegiatan: 'Bahasa Inggris', keterangan: 'R-301' },
      ],
      createdBy: 'Siti Aminah',
      createdAt: '2026-05-18'
    }
  ];
  
  export const presensiList: Presensi[] = [
    { id: '1', siswaId: '1', siswaNama: 'Dina Permata', kelas: 'XII IPA 1', tanggal: '2026-05-06', status: 'Hadir', keterangan: 'Tepat waktu', mataPelajaran: 'Matematika Peminatan', jamMasuk: '06:55' },
    { id: '2', siswaId: '2', siswaNama: 'Rizky Aditya', kelas: 'XII IPA 1', tanggal: '2026-05-06', status: 'Hadir', keterangan: 'Tepat waktu', mataPelajaran: 'Matematika Peminatan', jamMasuk: '06:58' },
    { id: '3', siswaId: '3', siswaNama: 'Ayu Lestari', kelas: 'XII IPA 2', tanggal: '2026-05-06', status: 'Izin', keterangan: 'Sakit - Surat dokter', mataPelajaran: 'Fisika', jamMasuk: '-' },
    { id: '4', siswaId: '4', siswaNama: 'Dimas Pratama', kelas: 'XII IPS 1', tanggal: '2026-05-06', status: 'Alpha', keterangan: 'Tanpa keterangan', mataPelajaran: 'Ekonomi', jamMasuk: '-' },
    { id: '5', siswaId: '5', siswaNama: 'Sinta Dewi', kelas: 'XI IPA 1', tanggal: '2026-05-06', status: 'Terlambat', keterangan: 'Terlambat 15 menit', mataPelajaran: 'Kimia', jamMasuk: '07:15' },
  ];
  
  export const dashboardStats: DashboardStats = {
    totalKelas: 8,
    totalGuru: 45,
    totalSiswa: 291,
    hadirHariIni: 278,
    izinHariIni: 8,
    alphaHariIni: 5,
    persentaseKehadiran: 95.5,
  };
  
  export const chartData = {
    kehadiranBulanan: [
      { bulan: 'Jan', hadir: 94, izin: 4, alpha: 2 },
      { bulan: 'Feb', hadir: 96, izin: 3, alpha: 1 },
      { bulan: 'Mar', hadir: 92, izin: 5, alpha: 3 },
      { bulan: 'Apr', hadir: 95, izin: 3, alpha: 2 },
      { bulan: 'Mei', hadir: 97, izin: 2, alpha: 1 },
      { bulan: 'Jun', hadir: 93, izin: 4, alpha: 3 },
    ],
    aktivitasKelas: [
      { kelas: 'XII IPA 1', agenda: 24, presensi: 98 },
      { kelas: 'XII IPA 2', agenda: 20, presensi: 96 },
      { kelas: 'XII IPS 1', agenda: 18, presensi: 94 },
      { kelas: 'XI IPA 1', agenda: 22, presensi: 97 },
      { kelas: 'XI IPS 1', agenda: 16, presensi: 93 },
      { kelas: 'X IPA 1', agenda: 14, presensi: 95 },
    ],
  };