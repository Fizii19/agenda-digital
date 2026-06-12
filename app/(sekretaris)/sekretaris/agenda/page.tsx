'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { Calendar as CalendarIcon, CheckCircle, Clock, Edit2, Save } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Table from '@/components/ui/Table';
import { useFeedback } from '@/components/shared/FeedbackProvider';
import { formatTanggalPendek } from '@/lib/utils';
import { getSekretarisAgendaContext, saveSekretarisAgenda } from '@/app/actions/agenda';

type AgendaItemForm = {
  scheduleId: string;
  jamMulai: string;
  jamSelesai: string;
  kegiatan: string;
  guru: string;
  ruangan: string;
  statusGuru: string;
  keterangan: string;
};

type KelasOption = {
  id: string;
  nama: string;
  tahunAjaran: string;
  jumlahSiswa: number;
};

type RecentAgenda = {
  id: string;
  kelas: string;
  tanggal: string;
  createdBy: string;
  itemCount: number;
  updatedAt: string;
};

type AgendaContext = {
  userKelasId: string | null;
  tahunAjaranAktif: { id: string; nama: string } | null;
  selectedKelas: KelasOption | null;
  hari: string;
  jadwal: Array<{
    id: string;
    jamMulai: string;
    jamSelesai: string;
    subject: string;
    guru: string;
    ruangan: string;
    statusGuru: string;
    keterangan: string;
  }>;
  agendaHariIni: {
    id: string;
    kelas: string;
    tanggal: string;
    createdBy: string;
    updatedAt: string;
    items: Array<Omit<AgendaItemForm, 'scheduleId' | 'guru' | 'ruangan' | 'statusGuru'>>;
  } | null;
  recentAgendas: RecentAgenda[];
};

function getTodayInputValue() {
  return new Date().toISOString().split('T')[0];
}

const guruPresenceOptions = ['Hadir', 'Tidak Hadir', 'Digantikan', 'Tugas Mandiri', 'Ditiadakan'];

function buildItemsFromContext(context: AgendaContext): AgendaItemForm[] {
  if (context.jadwal.length > 0) {
    return context.jadwal.map((item) => ({
      scheduleId: item.id,
      jamMulai: item.jamMulai,
      jamSelesai: item.jamSelesai,
      kegiatan: item.subject,
      guru: item.guru,
      ruangan: item.ruangan,
      statusGuru: item.statusGuru || 'Hadir',
      keterangan: item.keterangan || '',
    }));
  }

  return [];
}

export default function AgendaPage() {
  const { notify } = useFeedback();
  const [tanggal, setTanggal] = useState(getTodayInputValue);
  const [kelasId, setKelasId] = useState('');
  const [context, setContext] = useState<AgendaContext | null>(null);
  const [items, setItems] = useState<AgendaItemForm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const loadContext = useCallback((nextTanggal = tanggal) => {
    setIsLoading(true);
    startTransition(async () => {
      const result = await getSekretarisAgendaContext(nextTanggal);

      if (!result.success) {
        notify({ title: 'Agenda tidak bisa dimuat', message: result.error, variant: 'error' });
        setIsLoading(false);
        return;
      }

      const nextContext = result as AgendaContext & { success: true };
      setContext(nextContext);
      setKelasId(nextContext.selectedKelas?.id ?? '');
      setItems(buildItemsFromContext(nextContext));
      setIsLoading(false);
    });
  }, [notify, tanggal]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadContext();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadContext]);

  const selectedKelasLabel = context?.selectedKelas
    ? `${context.selectedKelas.nama} - ${context.selectedKelas.tahunAjaran}`
    : 'Kelas belum dipilih';

  const agendaFilled = Boolean(context?.agendaHariIni);
  const filledItems = useMemo(() => items.filter((item) => item.keterangan.trim()).length, [items]);

  const updateKeterangan = (index: number, value: string) => {
    setItems((current) => current.map((item, itemIndex) => (
      itemIndex === index ? { ...item, keterangan: value } : item
    )));
  };

  const updateStatusGuru = (index: number, value: string) => {
    setItems((current) => current.map((item, itemIndex) => (
      itemIndex === index ? { ...item, statusGuru: value } : item
    )));
  };

  const handleTanggalChange = (value: string) => {
    setTanggal(value);
    loadContext(value);
  };

  const handleSave = () => {
    if (!kelasId) {
      notify({ title: 'Kelas belum dipilih', message: 'Pilih kelas terlebih dahulu.', variant: 'warning' });
      return;
    }

    startTransition(async () => {
      const result = await saveSekretarisAgenda({ kelasId, tanggal, items });

      if (result.success) {
        notify({ title: 'Agenda tersimpan', message: 'Keterangan agenda kelas berhasil disimpan.', variant: 'success' });
        loadContext(tanggal);
      } else {
        notify({ title: 'Gagal menyimpan agenda', message: result.error, variant: 'error' });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Agenda Harian Kelas</h1>
          <p className="mt-1 text-sm text-gray-500">Lengkapi agenda berdasarkan jadwal pelajaran hari itu.</p>
        </div>
        <Button leftIcon={<Save className="h-4 w-4" />} onClick={handleSave} isLoading={isPending}>
          {agendaFilled ? 'Update Agenda' : 'Simpan Agenda'}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-50 p-3 text-[#4F46E5]"><CalendarIcon className="h-5 w-5" /></div>
            <div>
              <p className="text-sm text-gray-500">Tanggal</p>
              <p className="font-semibold text-gray-800">{formatTanggalPendek(tanggal)} ({context?.hari ?? '-'})</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600"><CheckCircle className="h-5 w-5" /></div>
            <div>
              <p className="text-sm text-gray-500">Status Agenda</p>
              <p className="font-semibold text-gray-800">{agendaFilled ? 'Sudah diisi' : 'Belum diisi'}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-50 p-3 text-amber-600"><Clock className="h-5 w-5" /></div>
            <div>
              <p className="text-sm text-gray-500">Baris Terisi</p>
              <p className="font-semibold text-gray-800">{filledItems} dari {items.length} keterangan</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-1 text-sm font-medium text-gray-700">Kelas</p>
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700">
              {selectedKelasLabel}
            </div>
          </div>
          <Input label="Tanggal" type="date" value={tanggal} onChange={(event) => handleTanggalChange(event.target.value)} />
        </div>
        {!context?.userKelasId && (
          <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Akun sekretaris ini belum terhubung ke kelas. Hubungi wali kelas untuk menjadikan siswa sebagai sekretaris kelas.
          </div>
        )}
      </Card>

      <Card padding="sm">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-800">{selectedKelasLabel}</h2>
          <p className="text-sm text-gray-500">Jam, mapel, dan guru mengikuti jadwal. Sekretaris hanya mengisi status guru dan keterangan.</p>
          </div>
          {agendaFilled && <Badge status="Mode Edit" className="bg-emerald-50 text-emerald-700 border-emerald-100" />}
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Memuat agenda...</div>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={`${item.jamMulai}-${index}`} className="grid gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 md:grid-cols-12">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-[10px] font-bold uppercase text-gray-400">Waktu</label>
                  <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700">
                    {item.jamMulai} - {item.jamSelesai}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-[10px] font-bold uppercase text-gray-400">Mata Pelajaran</label>
                  <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">{item.kegiatan}</div>
                </div>
                <div className="md:col-span-3">
                  <label className="mb-1 block text-[10px] font-bold uppercase text-gray-400">Guru / Ruangan</label>
                  <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">{[item.guru, item.ruangan].filter(Boolean).join(' - ') || '-'}</div>
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-[10px] font-bold uppercase text-gray-400">Presensi Guru</label>
                  <select value={item.statusGuru} onChange={(event) => updateStatusGuru(index, event.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-indigo-300">
                    {guruPresenceOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-3">
                  <label className="mb-1 block text-[10px] font-bold uppercase text-gray-400">Keterangan</label>
                  <input value={item.keterangan} onChange={(event) => updateKeterangan(index, event.target.value)} placeholder="Materi, tugas, guru hadir/tidak, atau catatan kelas" className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-300" />
                </div>
              </div>
            ))}
            {context?.jadwal.length === 0 && (
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                Belum ada jadwal untuk {context.hari}. Agenda baru bisa diisi setelah jadwal kelas dibuat.
              </div>
            )}
          </div>
        )}
      </Card>

      <Card padding="sm">
        <div className="mb-4 flex items-center gap-2">
          <Edit2 className="h-4 w-4 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-800">Riwayat Agenda Terbaru</h2>
        </div>
        <Table
          columns={[
            { key: 'tanggal', header: 'Tanggal', render: (item: RecentAgenda) => <span className="font-medium text-gray-800">{formatTanggalPendek(item.tanggal)}</span> },
            { key: 'kelas', header: 'Kelas' },
            { key: 'itemCount', header: 'Kegiatan', render: (item: RecentAgenda) => <Badge status={`${item.itemCount} Kegiatan`} className="bg-indigo-50 text-[#4F46E5] border-indigo-100" /> },
            { key: 'createdBy', header: 'Input Oleh' },
          ]}
          data={context?.recentAgendas ?? []}
          keyField="id"
          emptyMessage="Belum ada agenda untuk kelas ini"
        />
      </Card>
    </div>
  );
}
