'use client';
import { useState } from 'react';
import { Plus, Pencil, Trash2, Upload } from 'lucide-react';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import SearchFilter from '@/components/shared/SearchFilter';
import { guruList, Guru } from '@/lib/mock-data';

export default function GuruPage() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [guru, setGuru] = useState(guruList);

  const filtered = guru.filter(g => g.nama.toLowerCase().includes(search.toLowerCase()) || g.nip.includes(search));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-gray-800">Manajemen Guru</h1><p className="text-sm text-gray-500 mt-1">Kelola data guru dan mata pelajaran</p></div>
        <div className="flex gap-2">
          <Button variant="outline" leftIcon={<Upload className="w-4 h-4" />}>Upload CSV</Button>
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>Tambah Guru</Button>
        </div>
      </div>

      <SearchFilter searchValue={search} onSearchChange={setSearch} searchPlaceholder="Cari guru atau NIP..." onExport={() => {}} />

      <Card padding="sm">
        <Table
          columns={[
            { key: 'nip', header: 'NIP' },
            { key: 'nama', header: 'Nama', render: (g: Guru) => <span className="font-medium text-gray-800">{g.nama}</span> },
            { key: 'email', header: 'Email' },
            { key: 'telepon', header: 'Telepon' },
            { key: 'mataPelajaran', header: 'Mapel', render: (g: Guru) => <div className="flex flex-wrap gap-1">{g.mataPelajaran.map(m => <Badge key={m} status={m} className="bg-gray-100 text-gray-600 border-gray-200" />)}</div> },
            { key: 'status', header: 'Status', render: (g: Guru) => <Badge status={g.status} /> },
            { key: 'actions', header: 'Aksi', render: () => (
              <div className="flex gap-1.5">
                <button className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-[#4F46E5]"><Pencil className="w-4 h-4" /></button>
                <button className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            )},
          ]}
          data={filtered} keyField="id"
        />
      </Card>
    </div>
  );
}