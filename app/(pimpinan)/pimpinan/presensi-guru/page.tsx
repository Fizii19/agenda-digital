import { CalendarDays, CheckCircle, Clock, UserX, Users } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import StatCard from '@/components/shared/StatCard';
import prisma from '@/lib/prisma';
import { formatTanggalPendek } from '@/lib/utils';

const hariByIndex = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

type PageProps = {
  searchParams: Promise<{ tanggal?: string | string[] }>;
};

type PresensiGuruRow = {
  id: string;
  waktu: string;
  kelas: string;
  mapel: string;
  guru: string;
  ruangan: string;
  status: string;
  keterangan: string;
  inputBy: string;
};

function getTodayInputValue() {
  return new Date().toISOString().split('T')[0];
}

function getSingleParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function getHariFromDate(date: string) {
  return hariByIndex[new Date(`${date}T00:00:00`).getDay()] ?? 'Senin';
}

function getBadgeClass(status: string) {
  switch (status) {
    case 'Hadir':
      return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    case 'Tidak Hadir':
      return 'bg-rose-50 text-rose-700 border-rose-100';
    case 'Digantikan':
    case 'Tugas Mandiri':
      return 'bg-amber-50 text-amber-700 border-amber-100';
    case 'Ditiadakan':
      return 'bg-gray-50 text-gray-700 border-gray-200';
    default:
      return 'bg-sky-50 text-sky-700 border-sky-100';
  }
}

export default async function PresensiGuruMapelPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const tanggal = getSingleParam(params.tanggal) || getTodayInputValue();
  const hari = getHariFromDate(tanggal);

  const tahunAjaranAktif = await prisma.tahunajaran.findFirst({
    where: { aktif: true },
    select: { id: true, nama: true },
  });

  const schedules = await prisma.schedule.findMany({
    where: {
      hari,
      ...(tahunAjaranAktif
        ? { subject: { kelas: { tahunAjaranId: tahunAjaranAktif.id } } }
        : {}),
    },
    include: {
      subject: {
        include: {
          guru: { select: { id: true, name: true } },
          kelas: { select: { id: true, nama: true, tahunAjaran: true } },
        },
      },
      ruangan: { select: { nama: true } },
    },
    orderBy: { jamMulai: 'asc' },
  });

  const presensiGuru = await prisma.presensigurumapel.findMany({
    where: {
      tanggal,
      ...(tahunAjaranAktif
        ? { kelas: { tahunAjaranId: tahunAjaranAktif.id } }
        : {}),
    },
    include: {
      penginput: { select: { name: true } },
    },
  });

  const presensiByScheduleId = new Map(presensiGuru.map((item) => [item.scheduleId, item]));
  const rows: PresensiGuruRow[] = schedules
    .map((schedule) => {
      const presensi = presensiByScheduleId.get(schedule.id);

      return {
        id: schedule.id,
        waktu: `${schedule.jamMulai} - ${schedule.jamSelesai}`,
        kelas: schedule.subject.kelas.nama,
        mapel: schedule.subject.nama,
        guru: schedule.subject.guru.name,
        ruangan: schedule.ruangan?.nama ?? '-',
        status: presensi?.status ?? 'Belum Diisi',
        keterangan: presensi?.keterangan ?? '-',
        inputBy: presensi?.penginput.name ?? '-',
      };
    })
    .sort((a, b) => `${a.kelas}-${a.waktu}`.localeCompare(`${b.kelas}-${b.waktu}`));

  const hadirCount = rows.filter((row) => row.status === 'Hadir').length;
  const bermasalahCount = rows.filter((row) => ['Tidak Hadir', 'Digantikan', 'Tugas Mandiri', 'Ditiadakan'].includes(row.status)).length;
  const belumDiisiCount = rows.filter((row) => row.status === 'Belum Diisi').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Presensi Guru Mapel</h1>
          <p className="mt-1 text-sm text-gray-500">
            Pantau kehadiran guru per jadwal pelajaran pada {formatTanggalPendek(tanggal)}.
          </p>
        </div>
        <form className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="space-y-1 text-sm font-medium text-gray-700">
            <span>Tanggal</span>
            <input
              type="date"
              name="tanggal"
              defaultValue={tanggal}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none transition-all focus:border-[#4F46E5] focus:ring-2 focus:ring-indigo-100 sm:w-48"
            />
          </label>
          <Button type="submit" leftIcon={<CalendarDays className="h-4 w-4" />}>Tampilkan</Button>
        </form>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Jadwal" value={rows.length} icon={Clock} color="indigo" description={`${hari}${tahunAjaranAktif ? ` - ${tahunAjaranAktif.nama}` : ''}`} />
        <StatCard title="Guru Hadir" value={hadirCount} icon={CheckCircle} color="emerald" />
        <StatCard title="Perlu Dicek" value={bermasalahCount} icon={UserX} color="amber" description="Tidak hadir, diganti, tugas mandiri, atau ditiadakan" />
        <StatCard title="Belum Diisi" value={belumDiisiCount} icon={Users} color="rose" />
      </div>

      <Card padding="sm">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-gray-800">Daftar Presensi Guru</h2>
          <p className="text-sm text-gray-500">Data muncul dari input agenda sekretaris kelas.</p>
        </div>
        <Table
          columns={[
            { key: 'waktu', header: 'Waktu', render: (row: PresensiGuruRow) => <span className="font-medium text-gray-800">{row.waktu}</span> },
            { key: 'kelas', header: 'Kelas' },
            { key: 'mapel', header: 'Mapel' },
            { key: 'guru', header: 'Guru' },
            { key: 'ruangan', header: 'Ruangan' },
            { key: 'status', header: 'Status', render: (row: PresensiGuruRow) => <Badge status={row.status} className={getBadgeClass(row.status)} /> },
            { key: 'keterangan', header: 'Keterangan' },
            { key: 'inputBy', header: 'Diinput Oleh' },
          ]}
          data={rows}
          keyField="id"
          emptyMessage={`Tidak ada jadwal untuk hari ${hari}`}
        />
      </Card>
    </div>
  );
}
