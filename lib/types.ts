export type Role = 'admin' | 'sekretaris' | 'walikelas' | 'pimpinan' | 'siswa' | 'guru';

export interface User {
  id: string;
  name: string;
  email: string;
  nis?: string;
  nip?: string;
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
  tahunAjaranId?: string | null;
}

export interface TahunAjaran {
  id: string;
  nama: string;
  aktif: boolean;
}

export interface GuruOption {
  id: string;
  name: string;
  nip?: string | null;
}

export interface Ruangan {
  id: string;
  nama: string;
  tipe: string;
  kapasitas?: number | null;
  aktif: boolean;
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

export interface AgendaItem {
  jamMulai: string;
  jamSelesai: string;
  kegiatan: string;
  keterangan?: string;
}

export interface Agenda {
  id: string;
  kelas: string;
  tanggal: string;
  items: AgendaItem[];
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
