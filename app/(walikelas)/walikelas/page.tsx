'use client';
import { Users, CheckCircle, AlertTriangle, TrendingUp, Download } from 'lucide-react';
import StatCard from '@/components/shared/StatCard';
import Card from '@/components/ui/Card';
import { BarChartCard } from '@/components/ui/Chart';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { chartData, presensiList, agendaList, Presensi } from '@/lib/mock-data';
import { formatTanggalPendek } from '@/lib/utils';

export default function WaliKelasDashboard() {
  const kelasPresensi = presensiList.filter(p => p.kelas === 'XII IPA 1');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-gray-800">Dashboard Wali Kelas</h1><p className="text-sm text-gray-500 mt-1">Kelas: XII IPA 1 | Wali Kelas: Budi Santoso</p></div>
        <div className="flex gap-2">
          <Button variant="outline" leftIcon={<Download className="w-4 h-4" />}>Export PDF</Button>
          <Button variant="outline" leftIcon={<Download className="w-4 h-4" />}>Export Excel</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Siswa Kelas" value={36} icon={Users} color="indigo" />
        <StatCard title="Hadir Hari Ini" value={34} icon={CheckCircle} color="emerald" />
        <StatCard title="Alpha/Izin" value={2} icon={AlertTriangle} color="amber" />
        <StatCard title="Rata Kehadiran" value="97%" icon={TrendingUp} color="sky" />
      </div>

      <BarChartCard title="Statistik Kehadiran Kelas XII IPA 1" data={chartData.kehadiranBulanan} xKey="bulan"
        bars={[{ key: 'hadir', color: '#4F46E5', name: 'Hadir' }, { key: 'izin', color: '#F59E0B', name: 'Izin' }, { key: 'alpha', color: '#EF4444', name: 'Alpha' }]} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-base font-semibold text-gray-800 mb-4">Presensi Hari Ini</h3>
          <Table columns={[
            { key: 'siswaNama', header: 'Nama' }, { key: 'status', header: 'Status', render: (p: Presensi) => <Badge status={p.status} /> }, { key: 'keterangan', header: 'Keterangan' },
          ]} data={kelasPresensi} keyField="id" />
        </Card>
        <Card>
          <h3 className="text-base font-semibold text-gray-800 mb-4">Agenda Kelas</h3>
          <div className="space-y-3">
            {agendaList.filter(a => a.kelas === 'XII IPA 1').map(a => (
              <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                <div><p className="text-sm font-medium">{a.judul}</p><p className="text-xs text-gray-400">{formatTanggalPendek(a.tanggal)}</p></div>
                <Badge status={a.status} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}