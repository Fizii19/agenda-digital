'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { DoorOpen, Download, FileSpreadsheet, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import Table from '@/components/ui/Table';
import SearchFilter from '@/components/shared/SearchFilter';
import { useFeedback } from '@/components/shared/FeedbackProvider';
import { createRuangan, deleteRuangan, getRuanganList, importRuangan, updateRuangan } from '@/app/actions/ruangan';
import { Ruangan } from '@/lib/types';

const tipeOptions = [
  { value: 'Kelas', label: 'Kelas' },
  { value: 'Lab', label: 'Lab' },
  { value: 'Bengkel', label: 'Bengkel' },
  { value: 'Aula', label: 'Aula' },
  { value: 'Lainnya', label: 'Lainnya' },
];

type ActionMessage = {
  type: 'success' | 'error';
  text: string;
  details?: string[];
};

export default function RuanganPage() {
  const { notify, confirm } = useFeedback();
  const [search, setSearch] = useState('');
  const [ruangan, setRuangan] = useState<Ruangan[]>([]);
  const [editingRuangan, setEditingRuangan] = useState<Ruangan | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [message, setMessage] = useState<ActionMessage | null>(null);
  const [isImportPending, startImportTransition] = useTransition();
  const importFormRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    nama: '',
    tipe: 'Kelas',
    kapasitas: '',
    aktif: 'true',
  });

  const fetchRuangan = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getRuanganList();
      setRuangan(data as Ruangan[]);
    } catch (error) {
      console.error('Error fetching ruangan:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchRuangan();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [fetchRuangan]);

  const handleOpenAdd = () => {
    setEditingRuangan(null);
    setFormData({
      nama: '',
      tipe: 'Kelas',
      kapasitas: '',
      aktif: 'true',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item: Ruangan) => {
    setEditingRuangan(item);
    setFormData({
      nama: item.nama,
      tipe: item.tipe,
      kapasitas: item.kapasitas ? String(item.kapasitas) : '',
      aktif: item.aktif ? 'true' : 'false',
    });
    setShowModal(true);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);

    const payload = {
      nama: formData.nama,
      tipe: formData.tipe,
      kapasitas: formData.kapasitas ? Number(formData.kapasitas) : null,
      aktif: formData.aktif === 'true',
    };
    const result = editingRuangan ? await updateRuangan(editingRuangan.id, payload) : await createRuangan(payload);

    if (result.success) {
      setShowModal(false);
      setMessage({ type: 'success', text: editingRuangan ? 'Ruangan berhasil diperbarui.' : 'Ruangan berhasil ditambahkan.' });
      notify({
        title: editingRuangan ? 'Ruangan diperbarui' : 'Ruangan ditambahkan',
        message: editingRuangan ? 'Perubahan ruangan sudah disimpan.' : 'Data ruangan baru sudah masuk.',
        variant: 'success',
      });
      fetchRuangan();
    } else {
      setMessage({ type: 'error', text: result.error ?? 'Gagal menyimpan ruangan.' });
      notify({ title: 'Gagal menyimpan ruangan', message: result.error ?? 'Gagal menyimpan ruangan.', variant: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    const shouldDelete = await confirm({
      title: 'Hapus ruangan?',
      message: 'Data ruangan ini akan dihapus dari sistem dan tidak bisa dipakai lagi.',
      confirmText: 'Hapus',
      cancelText: 'Batal',
      tone: 'danger',
    });

    if (!shouldDelete) return;

    const result = await deleteRuangan(id);
    if (result.success) {
      setMessage({ type: 'success', text: 'Ruangan berhasil dihapus.' });
      notify({ title: 'Ruangan dihapus', message: 'Data ruangan berhasil dihapus.', variant: 'success' });
      fetchRuangan();
    } else {
      setMessage({ type: 'error', text: result.error ?? 'Gagal menghapus ruangan.' });
      notify({ title: 'Gagal menghapus ruangan', message: result.error ?? 'Gagal menghapus ruangan.', variant: 'error' });
    }
  };

  const handleImport = (formData: FormData) => {
    setMessage(null);
    startImportTransition(async () => {
      const result = await importRuangan(formData);
      setMessage({
        type: result.success ? 'success' : 'error',
        text: result.message,
        details: result.errors,
      });

      if (result.imported || result.updated) {
        importFormRef.current?.reset();
        setShowImportModal(false);
        fetchRuangan();
      }
    });
  };

  const downloadCsvTemplate = () => {
    const csv = [
      ['nama', 'tipe', 'kapasitas', 'aktif'],
      ['R-101', 'Kelas', '36', 'ya'],
      ['LAB PPLG 1', 'Lab', '32', 'ya'],
      ['AULA', 'Aula', '200', 'ya'],
      ['GUDANG', 'Lainnya', '', 'tidak'],
    ].map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');

    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'contoh-import-ruangan.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const filtered = ruangan.filter((item) => {
    const query = search.toLowerCase();
    return item.nama.toLowerCase().includes(query) || item.tipe.toLowerCase().includes(query);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manajemen Ruangan</h1>
          <p className="mt-1 text-sm text-gray-500">Kelola ruang kelas, lab, bengkel, dan aula</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" leftIcon={<Upload className="w-4 h-4" />} onClick={() => setShowImportModal(true)}>Import</Button>
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={handleOpenAdd}>Tambah Ruangan</Button>
        </div>
      </div>

      {message && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${message.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
          <p className="font-medium">{message.text}</p>
          {message.details && message.details.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
              {message.details.map((detail) => <li key={detail}>{detail}</li>)}
            </ul>
          )}
        </div>
      )}

      <SearchFilter searchValue={search} onSearchChange={setSearch} searchPlaceholder="Cari ruangan atau tipe..." onExport={downloadCsvTemplate} exportLabel="Contoh CSV" />

      <Card padding="sm">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Memuat data...</div>
        ) : (
          <Table
            columns={[
              { key: 'nama', header: 'Nama Ruangan', render: (item: Ruangan) => <span className="font-medium text-gray-800">{item.nama}</span> },
              { key: 'tipe', header: 'Tipe', render: (item: Ruangan) => <Badge status={item.tipe} className="bg-gray-100 text-gray-600 border-gray-200" /> },
              { key: 'kapasitas', header: 'Kapasitas', render: (item: Ruangan) => item.kapasitas ? `${item.kapasitas} orang` : <span className="text-gray-400">-</span> },
              { key: 'aktif', header: 'Status', render: (item: Ruangan) => <Badge status={item.aktif ? 'Aktif' : 'Non-Aktif'} /> },
              {
                key: 'actions',
                header: 'Aksi',
                render: (item: Ruangan) => (
                  <div className="flex gap-1">
                    <button onClick={() => handleOpenEdit(item)} className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-[#4F46E5] transition-colors" title="Edit Ruangan">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Hapus Ruangan">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ),
              },
            ]}
            data={filtered}
            keyField="id"
            emptyMessage="Belum ada data ruangan"
          />
        )}
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingRuangan ? 'Edit Ruangan' : 'Tambah Ruangan'} footer={
        <>
          <Button variant="ghost" type="button" onClick={() => setShowModal(false)}>Batal</Button>
          <Button type="submit" form="ruangan-form">Simpan</Button>
        </>
      }>
        <form id="ruangan-form" className="space-y-4" onSubmit={handleSave}>
          <Input label="Nama Ruangan" placeholder="Contoh: LAB PPLG 1" value={formData.nama} onChange={(event) => setFormData({ ...formData, nama: event.target.value })} required leftIcon={<DoorOpen className="w-4 h-4" />} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select label="Tipe" value={formData.tipe} onChange={(event) => setFormData({ ...formData, tipe: event.target.value })} options={tipeOptions} required />
            <Input label="Kapasitas" type="number" min={1} placeholder="36" value={formData.kapasitas} onChange={(event) => setFormData({ ...formData, kapasitas: event.target.value })} />
          </div>
          <Select
            label="Status"
            value={formData.aktif}
            onChange={(event) => setFormData({ ...formData, aktif: event.target.value })}
            options={[
              { value: 'true', label: 'Aktif' },
              { value: 'false', label: 'Non-Aktif' },
            ]}
            required
          />
        </form>
      </Modal>

      <Modal isOpen={showImportModal} onClose={() => setShowImportModal(false)} title="Import Data Ruangan" footer={
        <>
          <Button variant="ghost" type="button" onClick={() => setShowImportModal(false)}>Tutup</Button>
          <Button type="submit" form="import-ruangan-form" isLoading={isImportPending} leftIcon={<FileSpreadsheet className="h-4 w-4" />}>Import</Button>
        </>
      }>
        <form id="import-ruangan-form" ref={importFormRef} action={handleImport} className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
            Format CSV/XLSX: kolom A nama, B tipe, C kapasitas, dan D aktif. Tipe yang didukung: Kelas, Lab, Bengkel, Aula, Lainnya.
          </div>
          <Input label="File CSV/XLSX" name="file" type="file" accept=".csv,.xlsx" required />
          <Button type="button" variant="outline" leftIcon={<Download className="h-4 w-4" />} onClick={downloadCsvTemplate}>
            Download Contoh CSV
          </Button>
        </form>
      </Modal>
    </div>
  );
}
