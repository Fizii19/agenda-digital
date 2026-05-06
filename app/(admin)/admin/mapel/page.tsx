'use client';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import SearchFilter from '@/components/shared/SearchFilter';
import { mapelList, MataPelajaran } from '@/lib/mock-data';

export default function MapelPage() {
  const [search, setSearch] = useState('');
  const filtered = mapelList.filter(m => m.nama.toLowerCase().includes(search.toLowerCase()) || m.kode.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-gray-800">Mata Pelajaran</h1><p className="text-sm text-gray-500 mt-1">Kelola data mata pelajaran</p></div>
        <Button leftIcon={<Plus className="w-4 h-4" />}>Tambah Mapel</Button>
      </div>
      <SearchFilter searchValue={search} onSearchChange={setSearch} />
      <Card padding="sm">
        <Table columns={[
          { key: 'kode', header: 'Kode' },
          { key: 'nama', header: 'Nama Mapel', render: (m: MataPelajaran) => <span className="font-medium">{m.nama}</span> },
          { key: 'guru', header: 'Guru Pengampu' },
          { key: 'tingkat', header: 'Tingkat' },
          { key: 'jurusan', header: 'Jurusan' },
          { key: 'jamPerMinggu', header: 'JPM' },
        ]} data={filtered} keyField="id" />
      </Card>
    </div>
  );
}