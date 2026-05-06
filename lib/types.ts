export type Role = 'admin' | 'sekretaris' | 'walikelas' | 'pimpinan' | 'siswa';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  kelas?: string;
}

export interface Kelas {
  id: string;
  nama: string;
  tingkat: number;
  jurusan: string;
  waliKelas: string;
  jumlahSiswa: number;
  tahunAjaran: string;
}

export interface Guru {
  id: string;
  nip: string;
  nama: string;
  email: string;
  telepon: string;
  mataPelajaran: string[];
  status: 'Aktif' | 'Cuti' | 'Non-Aktif';
  alamat: string;
}

export interface Siswa {
  id: string;
  nis: string;
  nama: string;
  kelas: string;
  email: string;
  telepon: string;
  alamat: string;
  status: 'Aktif' | 'Pindah' | 'Lulus' | 'Non-Aktif';
}

export interface MataPelajaran {
  id: string;
  kode: string;
  nama: string;
  guru: string;
  tingkat: number;
  jurusan: string;
  jamPerMinggu: number;
}

export interface Jadwal {
  id: string;
  kelas: string;
  hari: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu';
  jamMulai: string;
  jamSelesai: string;
  mataPelajaran: string;
  guru: string;
  ruangan: string;
}

export interface Agenda {
  id: string;
  judul: string;
  deskripsi: string;
  kelas: string;
  tanggal: string;
  kategori: 'Pelajaran' | 'Ujian' | 'Tugas' | 'Kegiatan' | 'Lainnya';
  status: 'Terjadwal' | 'Berlangsung' | 'Selesai' | 'Dibatalkan';
  createdBy: string;
  createdAt: string;
}

export interface Presensi {
  id: string;
  siswaId: string;
  siswaNama: string;
  kelas: string;
  tanggal: string;
  status: 'Hadir' | 'Izin' | 'Sakit' | 'Alpha' | 'Terlambat';
  keterangan: string;
  mataPelajaran: string;
  jamMasuk: string;
}

export interface DashboardStats {
  totalKelas: number;
  totalGuru: number;
  totalSiswa: number;
  hadirHariIni: number;
  izinHariIni: number;
  alphaHariIni: number;
  persentaseKehadiran: number;
}