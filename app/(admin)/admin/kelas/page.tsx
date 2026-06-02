'use client';
import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import SearchFilter from '@/components/shared/SearchFilter';
import { useFeedback } from '@/components/shared/FeedbackProvider';
import { GuruOption, Kelas, TahunAjaran } from '@/lib/types';
import { getKelasList, createKelas, updateKelas, deleteKelas, getTahunAjaranList, createTahunAjaran, setTahunAjaranAktif, deleteTahunAjaran, getGuruOptions } from '@/app/actions/kelas';
import KelasManagement from '@/components/shared/KelasManagement';
import { jurusanOptions, normalizeJurusan, tingkatOptions } from '@/lib/kelas-normalization';

export default function KelasPage() {
  const { notify, confirm } = useFeedback();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showTahunAjaranModal, setShowTahunAjaranModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [editingKelas, setEditingKelas] = useState<Kelas | null>(null);
  const [selectedKelas, setSelectedKelas] = useState<Kelas | null>(null);
  const [kelas, setKelas] = useState<Kelas[]>([]);
  const [tahunAjaranList, setTahunAjaranList] = useState<TahunAjaran[]>([]);
  const [guruOptions, setGuruOptions] = useState<GuruOption[]>([]);
  const [tahunAjaranInput, setTahunAjaranInput] = useState('');
  const [loading, setLoading] = useState(true);

  // Form states
  const [formData, setFormData] = useState({
    nama: '',
    tingkat: 10,
    jurusan: 'PPLG',
    waliKelas: '',
    waliKelasId: '',
    tahunAjaran: '',
    tahunAjaranId: ''
  });

  const fetchKelas = useCallback(async () => {
    setLoading(true);
    try {
      const [kelasData, tahunAjaranData, guruData] = await Promise.all([
        getKelasList(),
        getTahunAjaranList(),
        getGuruOptions(),
      ]);
      setKelas(kelasData.map((item) => ({
        ...item,
        jurusan: normalizeJurusan(item.jurusan),
        tahunAjaran: item.tahunajaran?.nama ?? item.tahunAjaran,
      })) as Kelas[]);
      setTahunAjaranList(tahunAjaranData);
      setGuruOptions(guruData);
    } catch (error) {
      console.error('Error fetching kelas:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchKelas();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [fetchKelas]);

  const getDefaultTahunAjaran = () => {
    const selected = tahunAjaranList.find((item) => item.aktif) ?? tahunAjaranList[0];
    return {
      tahunAjaran: selected?.nama ?? '',
      tahunAjaranId: selected?.id ?? '',
    };
  };

  const getAvailableGuruOptions = (currentKelasId?: string | null) => {
    return guruOptions.filter((guru) => {
      const isUsedElsewhere = kelas.some((item) => item.waliKelas === guru.name && item.id !== currentKelasId);
      return !isUsedElsewhere;
    });
  };

  const getGuruNameById = (guruId: string) => guruOptions.find((guru) => guru.id === guruId)?.name ?? '';

  const buildKelasPayload = () => ({
    nama: formData.nama,
    tingkat: formData.tingkat,
    jurusan: formData.jurusan,
    waliKelas: getGuruNameById(formData.waliKelasId),
    tahunAjaran: formData.tahunAjaran,
    tahunAjaranId: formData.tahunAjaranId,
  });

  const handleOpenAdd = () => {
    const availableGuruOptions = getAvailableGuruOptions();

    if (availableGuruOptions.length === 0) {
      notify({
        title: 'Tidak ada wali kelas kosong',
        message: 'Semua guru sudah menjadi wali kelas. Bebaskan dulu salah satunya sebelum menambah kelas baru.',
        variant: 'warning',
      });
      return;
    }

    const defaultTahunAjaran = getDefaultTahunAjaran();
    setEditingKelas(null);
    setFormData({
      nama: '',
      tingkat: 10,
      jurusan: 'PPLG',
      waliKelas: '',
      waliKelasId: '',
      tahunAjaran: defaultTahunAjaran.tahunAjaran,
      tahunAjaranId: defaultTahunAjaran.tahunAjaranId
    });
    setShowModal(true);
  };

  const handleOpenEdit = (k: Kelas) => {
    const selectedTahunAjaran = tahunAjaranList.find((item) => item.id === k.tahunAjaranId) ?? tahunAjaranList.find((item) => item.nama === k.tahunAjaran);
    setEditingKelas(k);
    setFormData({
      nama: k.nama,
      tingkat: k.tingkat,
      jurusan: normalizeJurusan(k.jurusan),
      waliKelas: k.waliKelas,
      waliKelasId: guruOptions.find((guru) => guru.name === k.waliKelas)?.id ?? '',
      tahunAjaran: selectedTahunAjaran?.nama ?? k.tahunAjaran,
      tahunAjaranId: selectedTahunAjaran?.id ?? k.tahunAjaranId ?? ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    const shouldDelete = await confirm({
      title: 'Hapus kelas?',
      message: 'Semua siswa di kelas ini akan dikeluarkan dan data kelas akan dihapus.',
      confirmText: 'Hapus',
      cancelText: 'Batal',
      tone: 'danger',
    });

    if (!shouldDelete) return;

    const res = await deleteKelas(id);
    if (res.success) {
      notify({ title: 'Kelas dihapus', message: 'Data kelas berhasil dihapus.', variant: 'success' });
      fetchKelas();
    } else {
      notify({ title: 'Gagal menghapus kelas', message: res.error, variant: 'error' });
    }
  };

  const handleCreateTahunAjaran = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await createTahunAjaran(tahunAjaranInput);

    if (res.success) {
      setTahunAjaranInput('');
      fetchKelas();
    } else {
      notify({ title: 'Gagal menambah tahun ajaran', message: res.error, variant: 'error' });
    }
  };

  const handleSetTahunAjaranAktif = async (id: string) => {
    const res = await setTahunAjaranAktif(id);

    if (res.success) {
      fetchKelas();
    } else {
      notify({ title: 'Gagal mengaktifkan tahun ajaran', message: res.error, variant: 'error' });
    }
  };

  const handleDeleteTahunAjaran = async (id: string) => {
    const res = await deleteTahunAjaran(id);

    if (res.success) {
      fetchKelas();
    } else {
      notify({ title: 'Gagal menghapus tahun ajaran', message: res.error, variant: 'error' });
    }
  };

  const handleTahunAjaranChange = (id: string) => {
    const selected = tahunAjaranList.find((item) => item.id === id);
    setFormData({
      ...formData,
      tahunAjaranId: selected?.id ?? '',
      tahunAjaran: selected?.nama ?? '',
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    let res;
    const payload = buildKelasPayload();
    if (!payload.waliKelas) {
      notify({
        title: 'Wali kelas belum dipilih',
        message: 'Pilih guru yang akan dijadikan wali kelas terlebih dahulu.',
        variant: 'warning',
      });
      return;
    }

    if (editingKelas) {
      res = await updateKelas(editingKelas.id, payload);
    } else {
      res = await createKelas(payload);
    }

    if (res.success) {
      setShowModal(false);
      fetchKelas();
    } else {
      notify({ title: 'Gagal menyimpan kelas', message: res.error, variant: 'error' });
    }
  };

  const filtered = kelas.filter(k => 
    k.nama.toLowerCase().includes(search.toLowerCase()) || 
    k.waliKelas.toLowerCase().includes(search.toLowerCase())
  );

  const availableGuruOptions = getAvailableGuruOptions(editingKelas?.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
            <h1 className="text-2xl font-bold text-gray-800">Manajemen Kelas</h1>
            <p className="text-sm text-gray-500 mt-1">Kelola data kelas dan wali kelas</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setShowTahunAjaranModal(true)}>Tahun Ajaran</Button>
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={handleOpenAdd}>Tambah Kelas</Button>
        </div>
      </div>

      <SearchFilter searchValue={search} onSearchChange={setSearch} searchPlaceholder="Cari kelas atau wali kelas..." onExport={() => {}} exportLabel="Export Excel" />

      <Card padding="sm">
        {loading ? (
            <div className="p-8 text-center text-gray-400">Memuat data...</div>
        ) : (
            <Table
            columns={[
                { key: 'nama', header: 'Nama Kelas', render: (k: Kelas) => <span className="font-medium text-gray-800">{k.nama}</span> },
                { key: 'tingkat', header: 'Tingkat', render: (k: Kelas) => <span className="text-gray-600">{k.tingkat}</span> },
                { key: 'jurusan', header: 'Jurusan' },
                { key: 'waliKelas', header: 'Wali Kelas' },
                { key: 'jumlahSiswa', header: 'Siswa', render: (k: Kelas) => <Badge status={`${k.jumlahSiswa} Siswa`} className="bg-blue-50 text-blue-700 border-blue-100" /> },
                { key: 'tahunAjaran', header: 'Tahun Ajaran' },
                {
                key: 'actions', header: 'Aksi', render: (k: Kelas) => (
                    <div className="flex gap-1">
                        <button onClick={() => { setSelectedKelas(k); setShowManageModal(true); }} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors" title="Kelola Siswa">
                            <Users className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleOpenEdit(k)} className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-[#4F46E5] transition-colors" title="Edit Kelas">
                            <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(k.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Hapus Kelas">
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

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingKelas ? 'Edit Kelas' : 'Tambah Kelas Baru'} footer={
        <><Button variant="ghost" onClick={() => setShowModal(false)}>Batal</Button><Button onClick={handleSave}>Simpan</Button></>
      }>
        <form className="space-y-4" onSubmit={handleSave}>
          <Input label="Nama Kelas" placeholder="Contoh: XII IPA 1" value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} required />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Tingkat"
              value={String(formData.tingkat)}
              onChange={e => setFormData({...formData, tingkat: Number(e.target.value)})}
              options={tingkatOptions.map((tingkat) => ({ value: String(tingkat), label: String(tingkat) }))}
              required
            />
            <Select
              label="Jurusan"
              value={formData.jurusan}
              onChange={e => setFormData({...formData, jurusan: e.target.value})}
              options={jurusanOptions.map((jurusan) => ({ value: jurusan, label: jurusan }))}
              required
            />
          </div>
          <Select
            label="Wali Kelas"
            value={formData.waliKelasId}
            onChange={e => setFormData({...formData, waliKelasId: e.target.value, waliKelas: getGuruNameById(e.target.value)})}
            options={availableGuruOptions.map((guru) => ({ value: guru.id, label: guru.nip ? `${guru.name} - ${guru.nip}` : guru.name }))}
            required
          />
          <Select
            label="Tahun Ajaran"
            value={formData.tahunAjaranId}
            onChange={e => handleTahunAjaranChange(e.target.value)}
            options={tahunAjaranList.map((item) => ({ value: item.id, label: item.aktif ? `${item.nama} (Aktif)` : item.nama }))}
            required
          />
        </form>
      </Modal>

      <Modal isOpen={showTahunAjaranModal} onClose={() => setShowTahunAjaranModal(false)} title="Kelola Tahun Ajaran" size="lg">
        <div className="space-y-5">
          <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleCreateTahunAjaran}>
            <div className="flex-1">
              <Input
                label="Tahun Ajaran Baru"
                placeholder="Contoh: 2026/2027"
                value={tahunAjaranInput}
                onChange={(e) => setTahunAjaranInput(e.target.value)}
                required
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" leftIcon={<Plus className="w-4 h-4" />}>Tambah</Button>
            </div>
          </form>

          <div className="rounded-xl border border-gray-100 overflow-hidden">
            <Table
              columns={[
                { key: 'nama', header: 'Tahun Ajaran', render: (item: TahunAjaran) => <span className="font-medium text-gray-800">{item.nama}</span> },
                { key: 'aktif', header: 'Status', render: (item: TahunAjaran) => item.aktif ? <Badge status="Aktif" /> : <span className="text-gray-400">-</span> },
                {
                  key: 'actions',
                  header: 'Aksi',
                  render: (item: TahunAjaran) => (
                    <div className="flex gap-1.5">
                      {!item.aktif && (
                        <button onClick={() => handleSetTahunAjaranAktif(item.id)} className="px-2 py-1 text-xs font-medium rounded-lg text-[#4F46E5] hover:bg-indigo-50 transition-colors">
                          Set Aktif
                        </button>
                      )}
                      <button onClick={() => handleDeleteTahunAjaran(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Hapus Tahun Ajaran">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ),
                },
              ]}
              data={tahunAjaranList}
              keyField="id"
              emptyMessage="Belum ada tahun ajaran"
            />
          </div>
        </div>
      </Modal>

      {selectedKelas && (
          <KelasManagement kelas={selectedKelas} isOpen={showManageModal} onClose={() => { setShowManageModal(false); fetchKelas(); }} />
      )}
    </div>
  );
}
