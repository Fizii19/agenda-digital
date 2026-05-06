'use client';
import Card from '@/components/ui/Card';
import { BarChartCard } from '@/components/ui/Chart';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import StatCard from '@/components/shared/StatCard';
import { Eye, Users, Clock, AlertTriangle } from 'lucide-react';
import { chartData, kelasList, presensiList } from '@/lib/mock-data';

export default function MonitoringPage() {
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-800">Monitoring Semua Kelas</h1><p className="text-sm text-gray-500 mt-1">Pantau aktivitas dan presensi seluruh kelas</p></div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Kelas Aktif" value={8} icon={Eye} color="indigo" />
        <StatCard title="Total Siswa Hadir" value={278} icon={Users} color="emerald" />
        <StatCard title="Rata-rata Kehadiran" value="95.5%" icon={Clock} color="sky" />
        <StatCard title="Alpha Hari Ini" value={5} icon={AlertTriangle} color="rose" />
      </div>

      <BarChartCard title="Aktivitas Kelas" data={chartData.aktivitasKelas} xKey="kelas"
        bars={[{ key: 'agenda', color: '#4F46E5', name: 'Agenda' }, { key: 'presensi', color: '#10B981', name: 'Presensi %' }]} />

      <Card>
        <h3 className="text-base font-semibold text-gray-800 mb-4">Presensi Hari Ini</h3>
        <Table columns={[
          { key: 'siswaNama', header: 'Nama Siswa' },
          { key: 'kelas', header: 'Kelas' },
          { key: 'mataPelajaran', header: 'Mapel' },
          { key: 'status', header: 'Status', render: (p: any) => <Badge status={p.status} /> },
          { key: 'keterangan', header: 'Keterangan' },
        ]} data={presensiList} keyField="id" />
      </Card>
    </div>
  );
}