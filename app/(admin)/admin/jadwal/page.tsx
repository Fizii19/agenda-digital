'use client';
import { useCallback, useEffect, useState } from 'react';
import { Plus, Clock, ChevronRight, Calendar as CalendarIcon, Upload, Download, ArrowLeft, Trash2, Edit2 } from 'lucide-react';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import SearchFilter from '@/components/shared/SearchFilter';
import { useFeedback } from '@/components/shared/FeedbackProvider';
import { 
  getKelasWithScheduleCount, 
  getJadwalByKelas, 
  getRuanganList, 
  getSubjectsByKelas,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  importJadwalCSV
} from '@/app/actions/jadwal';

const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

type KelasScheduleSummary = {
  id: string;
  nama: string;
  tingkat: number;
  jurusan: string;
  scheduleCount: number;
};

type RuanganOption = {
  id: string;
  nama: string;
};

type SubjectOption = {
  id: string;
  nama: string;
  guru: {
    name: string;
  };
};

type JadwalRow = {
  id: string;
  hari: string;
  jamMulai: string;
  jamSelesai: string;
  subjectId: string;
  ruanganId: string | null;
  subject: {
    nama: string;
    guru: {
      name: string;
    };
  };
  ruangan: {
    nama: string;
  } | null;
};

type ImportResult = {
  success?: boolean;
  imported?: number;
  errors?: string[];
};

export default function JadwalPage() {
  const { notify, confirm } = useFeedback();
  const [search, setSearch] = useState('');
  const [kelas, setKelas] = useState<KelasScheduleSummary[]>([]);
  const [selectedKelas, setSelectedKelas] = useState<KelasScheduleSummary | null>(null);
  const [jadwal, setJadwal] = useState<JadwalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHari, setSelectedHari] = useState('Senin');
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingJadwal, setEditingJadwal] = useState<JadwalRow | null>(null);
  
  // Data for Selects
  const [ruangans, setRuangans] = useState<RuanganOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  
  // Form State
  const [formData, setFormData] = useState({
    hari: 'Senin',
    jamMulai: '07:00',
    jamSelesai: '08:30',
    subjectId: '',
    ruanganId: ''
  });

  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const fetchKelas = useCallback(async () => {
    setLoading(true);
    const data = await getKelasWithScheduleCount();
    setKelas(data as KelasScheduleSummary[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchKelas();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [fetchKelas]);

  const handleSelectKelas = async (k: KelasScheduleSummary) => {
    setSelectedKelas(k);
    setLoading(true);
    const [jadwalData, ruanganData, subjectData] = await Promise.all([
      getJadwalByKelas(k.id),
      getRuanganList(),
      getSubjectsByKelas(k.id)
    ]);
    setJadwal(jadwalData as JadwalRow[]);
    setRuangans(ruanganData as RuanganOption[]);
    setSubjects(subjectData as SubjectOption[]);
    setLoading(false);
  };

  const handleOpenAdd = () => {
    setEditingJadwal(null);
    setFormData({
      hari: selectedHari,
      jamMulai: '07:00',
      jamSelesai: '08:30',
      subjectId: '',
      ruanganId: ''
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (j: JadwalRow) => {
    setEditingJadwal(j);
    setFormData({
      hari: j.hari,
      jamMulai: j.jamMulai,
      jamSelesai: j.jamSelesai,
      subjectId: j.subjectId,
      ruanganId: j.ruanganId || ''
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!selectedKelas) return;

    const shouldDelete = await confirm({
      title: 'Hapus jadwal?',
      message: 'Jadwal ini akan dihapus dari kelas terpilih.',
      confirmText: 'Hapus',
      cancelText: 'Batal',
      tone: 'danger',
    });

    if (!shouldDelete) return;

    const res = await deleteSchedule(id);
    if (res.success) {
      notify({ title: 'Jadwal dihapus', message: 'Jadwal berhasil dihapus.', variant: 'success' });
      const data = await getJadwalByKelas(selectedKelas.id);
      setJadwal(data as JadwalRow[]);
    } else {
      notify({ title: 'Gagal menghapus jadwal', message: res.error, variant: 'error' });
    }
  };

  const submitSchedule = async () => {
    if (!selectedKelas) return;

    let res;
    if (editingJadwal) {
      res = await updateSchedule(editingJadwal.id, formData);
    } else {
      res = await createSchedule(formData);
    }

    if (res.success) {
      setShowAddModal(false);
      const data = await getJadwalByKelas(selectedKelas.id);
      setJadwal(data as JadwalRow[]);
      notify({
        title: editingJadwal ? 'Jadwal diperbarui' : 'Jadwal ditambahkan',
        message: editingJadwal ? 'Perubahan jadwal sudah disimpan.' : 'Jadwal baru sudah masuk.',
        variant: 'success',
      });
    } else {
      notify({ title: 'Gagal menyimpan jadwal', message: res.error, variant: 'error' });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitSchedule();
  };

  const handleImport = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await importJadwalCSV(formData);
    setImportResult(res);
    setLoading(false);
    if (res.success) {
        void fetchKelas();
        notify({
          title: 'Import jadwal selesai',
          message: `${res.imported ?? 0} baris berhasil ditambahkan.`,
          variant: 'success',
        });
    } else {
        notify({ title: 'Import jadwal gagal', message: res.error ?? 'Gagal mengimpor jadwal.', variant: 'error' });
    }
  };

  const downloadTemplate = () => {
    const csv = "hari,jam_mulai,jam_selesai,kelas,mata_pelajaran,ruangan\nSenin,07:00,08:30,XII IPA 1,Matematika Peminatan,R-301";
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'template_jadwal.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const filteredKelas = kelas.filter((k) => k.nama.toLowerCase().includes(search.toLowerCase()));
  const filteredJadwal = jadwal.filter((j) => j.hari === selectedHari);

  if (selectedKelas) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
            <button onClick={() => { setSelectedKelas(null); void fetchKelas(); }} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Jadwal Kelas {selectedKelas.nama}</h1>
                <p className="text-sm text-gray-500">Kelola jadwal mingguan untuk kelas ini</p>
            </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex gap-2 overflow-x-auto pb-2">
                {HARI.map(h => (
                    <button key={h} onClick={() => setSelectedHari(h)} 
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${selectedHari === h ? 'bg-[#4F46E5] text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:border-[#4F46E5] hover:text-[#4F46E5]'}`}>
                        {h}
                    </button>
                ))}
            </div>
            <Button leftIcon={<Plus className="w-4 h-4" />} onClick={handleOpenAdd}>Tambah Pelajaran</Button>
        </div>

        <Card padding="sm">
            {loading ? (
                <div className="p-8 text-center text-gray-400">Memuat jadwal...</div>
            ) : (
                <Table 
                    columns={[
                        { key: 'waktu', header: 'Waktu', render: (j: JadwalRow) => <span className="flex items-center gap-2 font-medium text-gray-700"><Clock className="w-4 h-4 text-gray-400" />{j.jamMulai} - {j.jamSelesai}</span> },
                        { key: 'mapel', header: 'Mata Pelajaran', render: (j: JadwalRow) => (
                            <div>
                                <p className="font-semibold text-gray-800">{j.subject.nama}</p>
                                <p className="text-xs text-gray-500">{j.subject.guru.name}</p>
                            </div>
                        )},
                        { key: 'ruangan', header: 'Ruangan', render: (j: JadwalRow) => j.ruangan ? <Badge status={j.ruangan.nama} className="bg-indigo-50 text-indigo-700 border-indigo-100" /> : <span className="text-gray-400">-</span> },
                        { key: 'actions', header: 'Aksi', render: (j: JadwalRow) => (
                            <div className="flex gap-1">
                                <button onClick={() => handleOpenEdit(j)} className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
                                <button onClick={() => handleDelete(j.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        )}
                    ]}
                    data={filteredJadwal}
                    keyField="id"
                    emptyMessage={`Belum ada jadwal untuk hari ${selectedHari}`}
                />
            )}
        </Card>

        {/* Add/Edit Modal */}
        <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title={editingJadwal ? 'Edit Jadwal' : 'Tambah Jadwal'} footer={
            <><Button variant="ghost" onClick={() => setShowAddModal(false)}>Batal</Button><Button onClick={submitSchedule}>Simpan</Button></>
        }>
            <form className="space-y-4" onSubmit={handleSave}>
                <Select label="Hari" value={formData.hari} onChange={e => setFormData({...formData, hari: e.target.value})} options={HARI.map(h => ({ value: h, label: h }))} required />
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Jam Mulai" type="time" value={formData.jamMulai} onChange={e => setFormData({...formData, jamMulai: e.target.value})} required />
                    <Input label="Jam Selesai" type="time" value={formData.jamSelesai} onChange={e => setFormData({...formData, jamSelesai: e.target.value})} required />
                </div>
                <Select label="Mata Pelajaran" value={formData.subjectId} onChange={e => setFormData({...formData, subjectId: e.target.value})} options={subjects.map(s => ({ value: s.id, label: `${s.nama} (${s.guru.name})` }))} required />
                <Select label="Ruangan (Opsional)" value={formData.ruanganId} onChange={e => setFormData({...formData, ruanganId: e.target.value})} options={ruangans.map(r => ({ value: r.id, label: r.nama }))} />
            </form>
        </Modal>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
            <h1 className="text-2xl font-bold text-gray-800">Jadwal Pelajaran</h1>
            <p className="text-sm text-gray-500 mt-1">Pilih kelas untuk mengelola jadwal mingguan</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" leftIcon={<Upload className="w-4 h-4" />} onClick={() => setShowImportModal(true)}>Import CSV</Button>
        </div>
      </div>

      <SearchFilter searchValue={search} onSearchChange={setSearch} searchPlaceholder="Cari nama kelas..." />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
            <div className="col-span-full p-8 text-center text-gray-400">Memuat daftar kelas...</div>
        ) : filteredKelas.map((k) => (
            <Card key={k.id} className="hover:border-[#4F46E5] transition-all cursor-pointer group" onClick={() => handleSelectKelas(k)}>
                <div className="flex items-center justify-between p-2">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center group-hover:bg-[#4F46E5] transition-colors">
                            <CalendarIcon className="w-6 h-6 text-[#4F46E5] group-hover:text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800">{k.nama}</h3>
                            <p className="text-xs text-gray-500">{k.scheduleCount} Jadwal Terdaftar</p>
                        </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#4F46E5] transition-colors" />
                </div>
            </Card>
        ))}
      </div>

      {/* Import Modal */}
      <Modal isOpen={showImportModal} onClose={() => { setShowImportModal(false); setImportResult(null); }} title="Import Jadwal dari CSV" footer={
          <Button variant="ghost" onClick={() => setShowImportModal(false)}>Tutup</Button>
      }>
        <div className="space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                <p className="text-xs text-amber-700 leading-relaxed font-medium">
                    Pastikan nama Kelas, Mata Pelajaran, dan Ruangan sesuai dengan data yang ada di sistem. Sistem akan otomatis mendeteksi bentrok ruangan atau guru.
                </p>
            </div>
            
            <form onSubmit={handleImport} className="space-y-4">
                <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">Pilih File CSV</label>
                    <input type="file" name="file" accept=".csv" required className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-[#4F46E5] hover:file:bg-indigo-100" />
                </div>
                <div className="flex items-center justify-between">
                    <button type="button" onClick={downloadTemplate} className="text-xs text-[#4F46E5] hover:underline flex items-center gap-1"><Download className="w-3 h-3" /> Download Template</button>
                    <Button type="submit" isLoading={loading} leftIcon={<Upload className="w-4 h-4" />}>Mulai Import</Button>
                </div>
            </form>

            {importResult && (
                <div className={`p-4 rounded-xl border ${importResult.success ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                    <p className="text-sm font-bold">Hasil Import:</p>
                    <p className="text-sm">{importResult.imported} baris berhasil ditambahkan.</p>
                    {importResult.errors && importResult.errors.length > 0 && (
                        <div className="mt-2 space-y-1">
                            <p className="text-xs font-semibold">Kesalahan ({importResult.errors.length}):</p>
                            <div className="max-h-32 overflow-y-auto space-y-1 pr-2">
                                {importResult.errors.map((err, i) => (
                                    <p key={i} className="text-[10px] bg-white/50 p-1 rounded">- {err}</p>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
      </Modal>
    </div>
  );
}
