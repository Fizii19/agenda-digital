'use client';
import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import SearchFilter from '@/components/shared/SearchFilter';
import { siswaList, Siswa } from '@/lib/mock-data';

export default function SiswaPage() {
  const [search, setSearch] = useState('');
  const filtered = siswaList.filter(s => s.nama.toLowerCase().includes(search.toLowerCase()) || s.nis.includes(search) || s.kelas.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-gray-800">Manajemen Siswa</h1><p className="text-sm text-gray-500 mt-1">Kelola data siswa</p></div>
        <Button leftIcon={<Plus className="w-4 h-4" />}>Tambah Siswa</Button>
      </div>
      <SearchFilter searchValue={search} onSearchChange={setSearch} onExport={() => {}} />
      <Card padding="sm">
        <Table
          columns={[
            { key: 'nis', header: 'NIS' },
            { key: 'nama', header: 'Nama', render: (s: Siswa) => <span className="font-medium">{s.nama}</span> },
            { key: 'kelas', header: 'Kelas' },
            { key: 'email', header: 'Email' },
            { key: 'status', header: 'Status', render: (s: Siswa) => <Badge status={s.status} /> },
            { key: 'actions', header: 'Aksi', render: () => <div className="flex gap-1.5"><button className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-[#4F46E5]"><Pencil className="w-4 h-4" /></button><button className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button></div> },
          ]}
          data={filtered} keyField="id"
        />
      </Card>
    </div>
  );
}