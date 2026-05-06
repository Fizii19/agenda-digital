'use client';
import { useState } from 'react';
import { Check, X, AlertCircle, Clock } from 'lucide-react';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import SearchFilter from '@/components/shared/SearchFilter';
import { presensiList, Presensi } from '@/lib/mock-data';

export default function PresensiPage() {
  const [search, setSearch] = useState('');
  const filtered = presensiList.filter(p => p.siswaNama.toLowerCase().includes(search.toLowerCase()) || p.kelas.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-gray-800">Presensi Siswa</h1><p className="text-sm text-gray-500 mt-1">Catat dan pantau kehadiran siswa</p></div>
        <div className="flex gap-2">
          <Button variant="outline" leftIcon={<Check className="w-4 h-4" />}>Tandai Hadir Semua</Button>
          <Button leftIcon={<Clock className="w-4 h-4" />}>Input Presensi</Button>
        </div>
      </div>

      <SearchFilter searchValue={search} onSearchChange={setSearch} onExport={() => {}} exportLabel="Export PDF" />

      <Card padding="sm">
        <Table columns={[
          { key: 'siswaNama', header: 'Nama Siswa', render: (p: Presensi) => <span className="font-medium">{p.siswaNama}</span> },
          { key: 'kelas', header: 'Kelas' },
          { key: 'mataPelajaran', header: 'Mata Pelajaran' },
          { key: 'tanggal', header: 'Tanggal' },
          { key: 'jamMasuk', header: 'Jam Masuk' },
          { key: 'status', header: 'Status', render: (p: Presensi) => <Badge status={p.status} /> },
          { key: 'keterangan', header: 'Keterangan' },
        ]} data={filtered} keyField="id" />
      </Card>
    </div>
  );
}