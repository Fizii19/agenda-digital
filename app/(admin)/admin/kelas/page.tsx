'use client';
import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import SearchFilter from '@/components/shared/SearchFilter';
import { kelasList, Kelas } from '@/lib/mock-data';

export default function KelasPage() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingKelas, setEditingKelas] = useState<Kelas | null>(null);
  const [kelas, setKelas] = useState(kelasList);

  const filtered = kelas.filter(k => k.nama.toLowerCase().includes(search.toLowerCase()) || k.waliKelas.toLowerCase().includes(search.toLowerCase()));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setShowModal(false);
    setEditingKelas(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-gray-800">Manajemen Kelas</h1><p className="text-sm text-gray-500 mt-1">Kelola data kelas dan wali kelas</p></div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => { setEditingKelas(null); setShowModal(true); }}>Tambah Kelas</Button>
      </div>

      <SearchFilter searchValue={search} onSearchChange={setSearch} searchPlaceholder="Cari kelas atau wali kelas..." onExport={() => {}} exportLabel="Export Excel" />

      <Card padding="sm">
        <Table
          columns={[
            { key: 'nama', header: 'Nama Kelas', render: (k: Kelas) => <span className="font-medium text-gray-800">{k.nama}</span> },
            { key: 'tingkat', header: 'Tingkat', render: (k: Kelas) => <span className="text-gray-600">{k.tingkat}</span> },
            { key: 'jurusan', header: 'Jurusan' },
            { key: 'waliKelas', header: 'Wali Kelas' },
            { key: 'jumlahSiswa', header: 'Jumlah Siswa' },
            { key: 'tahunAjaran', header: 'Tahun Ajaran' },
            {
              key: 'actions', header: 'Aksi', render: (k: Kelas) => (
                <div className="flex gap-1.5">
                  <button onClick={() => { setEditingKelas(k); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-[#4F46E5] transition-colors"><Pencil className="w-4 h-4" /></button>
                  <button className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              ),
            },
          ]}
          data={filtered} keyField="id"
        />
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingKelas ? 'Edit Kelas' : 'Tambah Kelas Baru'} footer={
        <><Button variant="ghost" onClick={() => setShowModal(false)}>Batal</Button><Button onClick={handleSave}>Simpan</Button></>
      }>
        <form className="space-y-4">
          <Input label="Nama Kelas" placeholder="Contoh: XII IPA 1" defaultValue={editingKelas?.nama} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Tingkat" type="number" placeholder="12" defaultValue={editingKelas?.tingkat} />
            <Input label="Jurusan" placeholder="IPA / IPS" defaultValue={editingKelas?.jurusan} />
          </div>
          <Input label="Wali Kelas" placeholder="Nama wali kelas" defaultValue={editingKelas?.waliKelas} />
          <Input label="Tahun Ajaran" placeholder="2025/2026" defaultValue={editingKelas?.tahunAjaran} />
        </form>
      </Modal>
    </div>
  );
}