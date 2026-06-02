'use client';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import { kelasList, presensiList, Presensi, guruList, Guru } from '@/lib/mock-data';

export default function MonitoringPage() {
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-800">Monitoring Kelas</h1><p className="text-sm text-gray-500 mt-1">Pantau seluruh kelas dan guru</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card><h3 className="text-base font-semibold text-gray-800 mb-4">Daftar Kelas</h3>
          <Table columns={[
            { key: 'nama', header: 'Kelas' }, { key: 'waliKelas', header: 'Wali Kelas' }, { key: 'jumlahSiswa', header: 'Siswa' },
          ]} data={kelasList} keyField="id" />
        </Card>
        <Card><h3 className="text-base font-semibold text-gray-800 mb-4">Status Guru</h3>
          <Table columns={[
            { key: 'nama', header: 'Nama' }, { key: 'mataPelajaran', header: 'Mapel', render: (g: Guru) => g.mataPelajaran.join(', ') }, { key: 'status', header: 'Status', render: (g: Guru) => <Badge status={g.status} /> },
          ]} data={guruList} keyField="id" />
        </Card>
      </div>
    </div>
  );
}