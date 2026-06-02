'use client';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import SearchFilter from '@/components/shared/SearchFilter';
import { presensiList, Presensi } from '@/lib/mock-data';
import { useState } from 'react';

export default function LaporanPresensiPage() {
  const [search, setSearch] = useState('');
  const filtered = presensiList.filter(p => p.kelas === 'XII IPA 1' && p.siswaNama.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-800">Laporan Presensi</h1><p className="text-sm text-gray-500 mt-1">Kelas XII IPA 1</p></div>
      <SearchFilter searchValue={search} onSearchChange={setSearch} onExport={() => {}} exportLabel="Export" />
      <Card padding="sm">
        <Table columns={[
          { key: 'siswaNama', header: 'Nama Siswa' }, { key: 'tanggal', header: 'Tanggal' }, { key: 'mataPelajaran', header: 'Mapel' }, { key: 'status', header: 'Status', render: (p: Presensi) => <Badge status={p.status} /> }, { key: 'keterangan', header: 'Keterangan' },
        ]} data={filtered} keyField="id" />
      </Card>
    </div>
  );
}