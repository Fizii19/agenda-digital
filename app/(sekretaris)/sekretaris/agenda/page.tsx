'use client';
import { useCallback, useEffect, useState } from 'react';
import { Plus, Save, Eye, Trash2, Clock, Calendar as CalendarIcon, Edit2 } from 'lucide-react';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import SearchFilter from '@/components/shared/SearchFilter';
import { useFeedback } from '@/components/shared/FeedbackProvider';
import { Agenda, AgendaItem } from '@/lib/types';
import { formatTanggalPendek, formatDate } from '@/lib/utils';
import { getAgendas, createAgenda, updateAgenda, deleteAgenda } from '@/app/actions/agenda';

export default function AgendaPage() {
  const { notify, confirm } = useFeedback();
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewAgenda, setPreviewAgenda] = useState<Agenda | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);

  // Form State
  const [selectedKelas, setSelectedKelas] = useState('XII IPA 1');
  const [selectedTanggal, setSelectedTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<Partial<AgendaItem>[]>([
    { jamMulai: '06:30', jamSelesai: '07:15', kegiatan: '' }
  ]);

  const fetchAgendas = useCallback(async () => {
    setIsLoading(true);
    const data = await getAgendas();
    setAgendas(data as Agenda[]);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchAgendas();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [fetchAgendas]);

  const handleAddItem = () => {
    const lastItem = items[items.length - 1];
    setItems([...items, { jamMulai: lastItem?.jamSelesai || '07:15', jamSelesai: '', kegiatan: '' }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof AgendaItem, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleEdit = (agenda: Agenda) => {
    setIsEditing(true);
    setCurrentId(agenda.id);
    setSelectedKelas(agenda.kelas);
    setSelectedTanggal(agenda.tanggal);
    setItems(agenda.items.map(item => ({ ...item })));
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    const shouldDelete = await confirm({
      title: 'Hapus agenda?',
      message: 'Agenda yang dihapus tidak bisa dikembalikan.',
      confirmText: 'Hapus',
      cancelText: 'Batal',
      tone: 'danger',
    });

    if (!shouldDelete) return;

    const result = await deleteAgenda(id);
    if (result.success) {
      notify({ title: 'Agenda dihapus', message: 'Agenda berhasil dihapus.', variant: 'success' });
      fetchAgendas();
    } else {
      notify({ title: 'Gagal menghapus agenda', message: result.error, variant: 'error' });
    }
  };

  const handleSave = async () => {
    // Basic validation
    if (items.some(item => !item.jamMulai || !item.jamSelesai || !item.kegiatan)) {
      notify({ title: 'Data belum lengkap', message: 'Mohon lengkapi semua bidang kegiatan.', variant: 'warning' });
      return;
    }

    // Get userId from cookies (simplified for this prototype)
    const userIdMatch = document.cookie.match(/userId=([^;]+)/);
    const userId = userIdMatch ? userIdMatch[1] : '1';

    let result;
    if (isEditing && currentId) {
      result = await updateAgenda(currentId, {
        kelas: selectedKelas,
        tanggal: selectedTanggal,
        items: items as AgendaItem[],
      });
    } else {
      result = await createAgenda({
        kelas: selectedKelas,
        tanggal: selectedTanggal,
        items: items as AgendaItem[],
        userId
      });
    }

    if (result.success) {
      setShowAddModal(false);
      setIsEditing(false);
      setCurrentId(null);
      fetchAgendas();
      // Reset items
      setItems([{ jamMulai: '06:30', jamSelesai: '07:15', kegiatan: '' }]);
      notify({ title: 'Agenda tersimpan', message: 'Agenda berhasil disimpan.', variant: 'success' });
    } else {
      notify({ title: 'Gagal menyimpan agenda', message: result.error, variant: 'error' });
    }
  };

  const filtered = agendas.filter(a => 
    a.kelas.toLowerCase().includes(search.toLowerCase()) || 
    a.tanggal.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Input Agenda Kelas</h1>
          <p className="text-sm text-gray-500 mt-1">Khusus Sekretaris: Kelola kegiatan harian kelas</p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => { setIsEditing(false); setItems([{ jamMulai: '06:30', jamSelesai: '07:15', kegiatan: '' }]); setShowAddModal(true); }}>Buat Agenda Hari Ini</Button>
      </div>

      <SearchFilter searchValue={search} onSearchChange={setSearch} onExport={() => {}} exportLabel="Export PDF" />

      <Card padding="sm">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Memuat data...</div>
        ) : (
          <Table columns={[
            { key: 'tanggal', header: 'Tanggal', render: (a: Agenda) => (
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-gray-400" />
                <span className="font-medium text-gray-800">{formatTanggalPendek(a.tanggal)}</span>
              </div>
            )},
            { key: 'kelas', header: 'Kelas' },
            { key: 'items', header: 'Jumlah Kegiatan', render: (a: Agenda) => <Badge status={`${a.items?.length || 0} Kegiatan`} className="bg-indigo-50 text-[#4F46E5] border-indigo-100" /> },
            { key: 'createdBy', header: 'ID Penginput', render: (a: Agenda) => <span className="text-xs text-gray-500">{a.createdBy}</span> },
            { key: 'actions', header: 'Aksi', render: (a: Agenda) => (
              <div className="flex items-center gap-1">
                <button onClick={() => { setPreviewAgenda(a); setShowPreviewModal(true); }} className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-[#4F46E5]" title="Lihat">
                  <Eye className="w-4 h-4" />
                </button>
                <button onClick={() => handleEdit(a)} className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-600" title="Edit">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(a.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600" title="Hapus">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )},
          ]} data={filtered} keyField="id" />
        )}
      </Card>

      {/* Add/Edit Agenda Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title={isEditing ? "Edit Agenda Harian" : "Input Agenda Harian"} size="xl"
        footer={<><Button variant="ghost" onClick={() => setShowAddModal(false)}>Batal</Button><Button leftIcon={<Save className="w-4 h-4" />} onClick={handleSave}>{isEditing ? "Perbarui" : "Simpan"} Agenda</Button></>}>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="Kelas" value={selectedKelas} onChange={(e) => setSelectedKelas(e.target.value)} options={[
              { value: 'XII IPA 1', label: 'XII IPA 1' }, { value: 'XII IPA 2', label: 'XII IPA 2' }, { value: 'XII IPS 1', label: 'XII IPS 1' },
            ]} />
            <Input label="Tanggal" type="date" value={selectedTanggal} onChange={(e) => setSelectedTanggal(e.target.value)} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-700">Detail Kegiatan (06:30 - 15:00)</label>
              <Button size="sm" variant="outline" leftIcon={<Plus className="w-3 h-3" />} onClick={handleAddItem}>Tambah Baris</Button>
            </div>
            
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 relative group">
                  <div className="col-span-12 md:col-span-3">
                    <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Waktu</label>
                    <div className="flex items-center gap-1">
                      <input type="time" value={item.jamMulai} onChange={(e) => updateItem(index, 'jamMulai', e.target.value)} 
                        className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-indigo-200 outline-none" />
                      <span className="text-gray-400">-</span>
                      <input type="time" value={item.jamSelesai} onChange={(e) => updateItem(index, 'jamSelesai', e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-indigo-200 outline-none" />
                    </div>
                  </div>
                  <div className="col-span-12 md:col-span-5">
                    <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Kegiatan / Mata Pelajaran</label>
                    <input type="text" placeholder="Contoh: Web Development" value={item.kegiatan} onChange={(e) => updateItem(index, 'kegiatan', e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-1 focus:ring-indigo-200 outline-none" />
                  </div>
                  <div className="col-span-10 md:col-span-3">
                    <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Keterangan (Opsional)</label>
                    <input type="text" placeholder="Guru / Ruangan" value={item.keterangan || ''} onChange={(e) => updateItem(index, 'keterangan', e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-1 focus:ring-indigo-200 outline-none" />
                  </div>
                  <div className="col-span-2 md:col-span-1 flex items-end pb-1.5">
                    <button onClick={() => handleRemoveItem(index)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal isOpen={showPreviewModal} onClose={() => setShowPreviewModal(false)} title="Detail Agenda Kelas" size="lg">
        {previewAgenda && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">{formatDate(previewAgenda.tanggal)}</h3>
                <p className="text-sm text-gray-500">Kelas: {previewAgenda.kelas}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">ID Penginput</p>
                <p className="text-sm font-medium text-gray-700">{previewAgenda.createdBy}</p>
              </div>
            </div>

            <div className="space-y-4">
              {previewAgenda.items?.map((item, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-12 text-xs font-bold text-[#4F46E5] bg-indigo-50 py-1 rounded-md text-center">{item.jamMulai}</div>
                    <div className="w-0.5 h-full bg-gray-100 my-1"></div>
                    <div className="w-12 text-xs font-bold text-gray-400 py-1 text-center">{item.jamSelesai}</div>
                  </div>
                  <div className="flex-1 bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                    <h4 className="font-semibold text-gray-800">{item.kegiatan}</h4>
                    {item.keterangan && <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5"><Clock className="w-3 h-3" /> {item.keterangan}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
