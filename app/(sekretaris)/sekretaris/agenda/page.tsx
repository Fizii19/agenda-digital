'use client';
import { useState } from 'react';
import { Plus, Calendar, Save, Eye } from 'lucide-react';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import SearchFilter from '@/components/shared/SearchFilter';
import { agendaList, Agenda } from '@/lib/mock-data';
import { formatTanggalPendek, formatDate } from '@/lib/utils';

export default function AgendaPage() {
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewAgenda, setPreviewAgenda] = useState<Agenda | null>(null);

  const filtered = agendaList.filter(a => a.judul.toLowerCase().includes(search.toLowerCase()) || a.kelas.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-gray-800">Input Agenda Kelas</h1><p className="text-sm text-gray-500 mt-1">Buat dan kelola agenda kegiatan kelas</p></div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowAddModal(true)}>Tambah Agenda</Button>
      </div>

      <SearchFilter searchValue={search} onSearchChange={setSearch} onExport={() => {}} exportLabel="Export PDF" />

      <Card padding="sm">
        <Table columns={[
          { key: 'judul', header: 'Judul Agenda', render: (a: Agenda) => <span className="font-medium">{a.judul}</span> },
          { key: 'kelas', header: 'Kelas' },
          { key: 'kategori', header: 'Kategori', render: (a: Agenda) => <Badge status={a.kategori} /> },
          { key: 'tanggal', header: 'Tanggal', render: (a: Agenda) => formatTanggalPendek(a.tanggal) },
          { key: 'status', header: 'Status', render: (a: Agenda) => <Badge status={a.status} /> },
          { key: 'actions', header: 'Aksi', render: (a: Agenda) => (
            <button onClick={() => { setPreviewAgenda(a); setShowPreviewModal(true); }} className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-[#4F46E5]"><Eye className="w-4 h-4" /></button>
          )},
        ]} data={filtered} keyField="id" />
      </Card>

      {/* Add Agenda Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Tambah Agenda Baru" size="lg"
        footer={<><Button variant="ghost" onClick={() => setShowAddModal(false)}>Batal</Button><Button leftIcon={<Save className="w-4 h-4" />} onClick={() => setShowAddModal(false)}>Simpan Agenda</Button></>}>
        <form className="space-y-4">
          <Input label="Judul Agenda" placeholder="Masukkan judul agenda" />
          <Select label="Kategori" options={[
            { value: 'Pelajaran', label: 'Pelajaran' }, { value: 'Ujian', label: 'Ujian' }, { value: 'Tugas', label: 'Tugas' }, { value: 'Kegiatan', label: 'Kegiatan' }, { value: 'Lainnya', label: 'Lainnya' },
          ]} />
          <Select label="Kelas" options={[
            { value: 'XII IPA 1', label: 'XII IPA 1' }, { value: 'XII IPA 2', label: 'XII IPA 2' }, { value: 'XII IPS 1', label: 'XII IPS 1' }, { value: 'Semua Kelas XII', label: 'Semua Kelas XII' },
          ]} />
          <Input label="Tanggal" type="date" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Deskripsi (Rich Text)</label>
            <textarea rows={5} placeholder="Tulis deskripsi agenda di sini..." className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#4F46E5] focus:ring-2 focus:ring-indigo-100 outline-none transition-all resize-none" />
          </div>
        </form>
      </Modal>

      {/* Preview Modal */}
      <Modal isOpen={showPreviewModal} onClose={() => setShowPreviewModal(false)} title="Preview Agenda" size="md">
        {previewAgenda && (
          <div className="space-y-4">
            <div><h3 className="text-lg font-bold text-gray-800">{previewAgenda.judul}</h3></div>
            <div className="flex flex-wrap gap-2">
              <Badge status={previewAgenda.kategori} />
              <Badge status={previewAgenda.status} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Kelas:</span> <span className="font-medium">{previewAgenda.kelas}</span></div>
              <div><span className="text-gray-500">Tanggal:</span> <span className="font-medium">{formatDate(previewAgenda.tanggal)}</span></div>
              <div><span className="text-gray-500">Dibuat oleh:</span> <span className="font-medium">{previewAgenda.createdBy}</span></div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4"><p className="text-sm text-gray-600">{previewAgenda.deskripsi}</p></div>
          </div>
        )}
      </Modal>
    </div>
  );
}