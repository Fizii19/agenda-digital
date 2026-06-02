'use client';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { Download, FileSpreadsheet, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import SearchFilter from '@/components/shared/SearchFilter';
import { useFeedback } from '@/components/shared/FeedbackProvider';
import { getMapelList, createMapel, updateMapel, deleteMapel, getGuruList, importMapel } from '@/app/actions/mapel';
import { getKelasList } from '@/app/actions/kelas';

type ActionMessage = {
  type: 'success' | 'error';
  text: string;
  details?: string[];
};

type MapelRow = {
  id: string;
  nama: string;
  kode: string | null;
  guruId: string;
  kelasId: string;
  jam: number;
  guru: { name: string };
  kelas: { nama: string };
};

type GuruRow = {
  id: string;
  name: string;
  nip?: string | null;
};

type KelasRow = {
  id: string;
  nama: string;
};

export default function MapelPage() {
  const { notify, confirm } = useFeedback();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingMapel, setEditingMapel] = useState<MapelRow | null>(null);
  const [mapel, setMapel] = useState<MapelRow[]>([]);
  const [gurus, setGurus] = useState<GuruRow[]>([]);
  const [kelas, setKelas] = useState<KelasRow[]>([]);
  const [message, setMessage] = useState<ActionMessage | null>(null);
  const [isImportPending, startImportTransition] = useTransition();
  const importFormRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [formData, setFormData] = useState({
    nama: '',
    kode: '',
    guruId: '',
    kelasId: '',
    jam: 2
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [mapelData, guruData, kelasData] = await Promise.all([
        getMapelList(),
        getGuruList(),
        getKelasList()
      ]);
      setMapel(mapelData as MapelRow[]);
      setGurus(guruData as GuruRow[]);
      setKelas(kelasData as KelasRow[]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchData();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [fetchData]);

  const handleOpenAdd = () => {
    setEditingMapel(null);
    setFormData({
      nama: '',
      kode: '',
      guruId: '',
      kelasId: '',
      jam: 2
    });
    setShowModal(true);
  };

  const handleOpenEdit = (m: MapelRow) => {
    setEditingMapel(m);
    setFormData({
      nama: m.nama,
      kode: m.kode || '',
      guruId: m.guruId,
      kelasId: m.kelasId,
      jam: m.jam
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    const shouldDelete = await confirm({
      title: 'Hapus mata pelajaran?',
      message: 'Data mata pelajaran ini akan dihapus dari penugasan guru dan kelas.',
      confirmText: 'Hapus',
      cancelText: 'Batal',
      tone: 'danger',
    });

    if (!shouldDelete) return;

    const res = await deleteMapel(id);
    if (res.success) {
      setMessage({ type: 'success', text: 'Mata pelajaran berhasil dihapus.' });
      notify({ title: 'Mapel dihapus', message: 'Data mata pelajaran berhasil dihapus.', variant: 'success' });
      fetchData();
    } else {
      setMessage({ type: 'error', text: res.error ?? 'Gagal menghapus mata pelajaran.' });
      notify({ title: 'Gagal menghapus mapel', message: res.error ?? 'Gagal menghapus mata pelajaran.', variant: 'error' });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    let res;
    if (editingMapel) {
      res = await updateMapel(editingMapel.id, formData);
    } else {
      res = await createMapel(formData);
    }

    if (res.success) {
      setShowModal(false);
      setMessage({ type: 'success', text: editingMapel ? 'Mata pelajaran berhasil diperbarui.' : 'Mata pelajaran berhasil ditambahkan.' });
      notify({
        title: editingMapel ? 'Mapel diperbarui' : 'Mapel ditambahkan',
        message: editingMapel ? 'Perubahan mata pelajaran sudah disimpan.' : 'Data mata pelajaran baru sudah masuk.',
        variant: 'success',
      });
      fetchData();
    } else {
      setMessage({ type: 'error', text: res.error ?? 'Gagal menyimpan mata pelajaran.' });
      notify({ title: 'Gagal menyimpan mapel', message: res.error ?? 'Gagal menyimpan mata pelajaran.', variant: 'error' });
    }
  };

  const handleImport = (formData: FormData) => {
    setMessage(null);
    startImportTransition(async () => {
      const result = await importMapel(formData);
      setMessage({
        type: result.success ? 'success' : 'error',
        text: result.message,
        details: result.errors,
      });

      if (result.imported || result.updated) {
        importFormRef.current?.reset();
        setShowImportModal(false);
        fetchData();
      }
    });
  };

  const downloadCsvTemplate = () => {
    const csv = [
      ['nama', 'kode', 'guru_nip', 'kelas', 'jam'],
      ['Bahasa Indonesia', 'BIND-10', '198601012010011001', '10 PPLG 1', '4'],
      ['Matematika', 'MTK-10', '198602022011012002', '10 PPLG 1', '4'],
      ['Dasar PPLG', 'DPPLG-10', '198603032012011003', '10 RPL 1', '6'],
    ].map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');

    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'contoh-import-mapel.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const filtered = mapel.filter(m => 
    m.nama.toLowerCase().includes(search.toLowerCase()) || 
    (m.kode && m.kode.toLowerCase().includes(search.toLowerCase())) ||
    m.guru.name.toLowerCase().includes(search.toLowerCase()) ||
    m.kelas.nama.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
            <h1 className="text-2xl font-bold text-gray-800">Mata Pelajaran</h1>
            <p className="text-sm text-gray-500 mt-1">Kelola data mata pelajaran dan penugasan guru</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" leftIcon={<Upload className="w-4 h-4" />} onClick={() => setShowImportModal(true)}>Import</Button>
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={handleOpenAdd}>Tambah Mapel</Button>
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

      <SearchFilter searchValue={search} onSearchChange={setSearch} searchPlaceholder="Cari mapel, guru, atau kelas..." onExport={downloadCsvTemplate} exportLabel="Contoh CSV" />

      <Card padding="sm">
        {loading ? (
            <div className="p-8 text-center text-gray-400">Memuat data...</div>
        ) : (
            <Table
            columns={[
                { key: 'nama', header: 'Nama Mapel', render: (m: MapelRow) => <span className="font-medium text-gray-800">{m.nama}</span> },
                { key: 'kode', header: 'Kode', render: (m: MapelRow) => <span className="text-xs font-mono bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">{m.kode || '-'}</span> },
                { key: 'guru', header: 'Guru Pengampu', render: (m: MapelRow) => <span>{m.guru.name}</span> },
                { key: 'kelas', header: 'Kelas', render: (m: MapelRow) => <span className="font-semibold text-indigo-600">{m.kelas.nama}</span> },
                { key: 'jam', header: 'JPM', render: (m: MapelRow) => <span>{m.jam} Jam</span> },
                {
                key: 'actions', header: 'Aksi', render: (m: MapelRow) => (
                    <div className="flex gap-1">
                        <button onClick={() => handleOpenEdit(m)} className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-[#4F46E5] transition-colors" title="Edit Mapel">
                            <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(m.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Hapus Mapel">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ),
                },
            ]}
            data={filtered} keyField="id"
            />
        )}
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingMapel ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran Baru'} footer={
        <><Button variant="ghost" onClick={() => setShowModal(false)}>Batal</Button><Button onClick={handleSave}>Simpan</Button></>
      }>
        <form className="space-y-4" onSubmit={handleSave}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Nama Mata Pelajaran" placeholder="Contoh: Bahasa Sunda" value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} required />
            <Input label="Kode (Opsional)" placeholder="Contoh: BSU-11" value={formData.kode} onChange={e => setFormData({...formData, kode: e.target.value})} />
          </div>
          
          <Select label="Guru Pengampu" value={formData.guruId} onChange={e => setFormData({...formData, guruId: e.target.value})} options={gurus.map(g => ({ value: g.id, label: g.name }))} required />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="Target Kelas" value={formData.kelasId} onChange={e => setFormData({...formData, kelasId: e.target.value})} options={kelas.map(k => ({ value: k.id, label: k.nama }))} required />
            <Input label="Jam Per Minggu (JPM)" type="number" min={1} value={formData.jam} onChange={e => setFormData({...formData, jam: parseInt(e.target.value)})} required />
          </div>
          
          <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
            <p className="text-xs text-indigo-700 leading-relaxed">
              <strong>Info:</strong> Satu mata pelajaran dalam satu kelas hanya bisa diampu oleh satu guru. Anda bisa menugaskan guru yang sama untuk mapel yang berbeda di kelas lain.
            </p>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showImportModal} onClose={() => setShowImportModal(false)} title="Import Mata Pelajaran" footer={
        <>
          <Button variant="ghost" type="button" onClick={() => setShowImportModal(false)}>Tutup</Button>
          <Button type="submit" form="import-mapel-form" isLoading={isImportPending} leftIcon={<FileSpreadsheet className="h-4 w-4" />}>Import</Button>
        </>
      }>
        <form id="import-mapel-form" ref={importFormRef} action={handleImport} className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
            Format CSV/XLSX: kolom A nama, B kode, C guru_nip, D kelas, dan E jam. Kelas otomatis dinormalisasi, misalnya RPL menjadi PPLG.
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
