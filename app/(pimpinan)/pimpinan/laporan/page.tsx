'use client';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import SearchFilter from '@/components/shared/SearchFilter';
import { useState } from 'react';
import { presensiList, Presensi, guruList, Guru } from '@/lib/mock-data';

export default function LaporanPage() {
  const [search, setSearch] = useState('');

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-800">Laporan Guru & Siswa</h1><p className="text-sm text-gray-500 mt-1">Ringkasan laporan seluruh sekolah</p></div>

      <Card><h3 className="text-base font-semibold text-gray-800 mb-4">Laporan Guru</h3>
        <Table columns={[
          { key: 'nama', header: 'Nama Guru' }, { key: 'nip', header: 'NIP' }, { key: 'mataPelajaran', header: 'Mapel', render: (g: Guru) => g.mataPelajaran.join(', ') }, { key: 'status', header: 'Status', render: (g: Guru) => <Badge status={g.status} /> },
        ]} data={guruList} keyField="id" />
      </Card>

      <Card><h3 className="text-base font-semibold text-gray-800 mb-4">Laporan Presensi Siswa</h3>
        <SearchFilter searchValue={search} onSearchChange={setSearch} onExport={() => {}} />
        <Table columns={[
          { key: 'siswaNama', header: 'Nama' }, { key: 'kelas', header: 'Kelas' }, { key: 'tanggal', header: 'Tanggal' }, { key: 'status', header: 'Status', render: (p: Presensi) => <Badge status={p.status} /> },
        ]} data={presensiList} keyField="id" />
      </Card>
    </div>
  );
}