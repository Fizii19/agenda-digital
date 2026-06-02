'use client';
import { School, Users, CheckCircle, TrendingUp, Eye } from 'lucide-react';
import StatCard from '@/components/shared/StatCard';
import Card from '@/components/ui/Card';
import { BarChartCard, LineChartCard } from '@/components/ui/Chart';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import { dashboardStats, chartData, kelasList, presensiList, Presensi } from '@/lib/mock-data';

export default function PimpinanDashboard() {
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-800">Dashboard Monitoring Sekolah</h1><p className="text-sm text-gray-500 mt-1">Ringkasan seluruh aktivitas sekolah</p></div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Total Kelas" value={dashboardStats.totalKelas} icon={School} color="indigo" />
        <StatCard title="Total Guru" value={dashboardStats.totalGuru} icon={Users} color="emerald" />
        <StatCard title="Total Siswa" value={dashboardStats.totalSiswa} icon={Users} color="sky" />
        <StatCard title="Kehadiran" value={`${dashboardStats.persentaseKehadiran}%`} icon={CheckCircle} color="amber" />
        <StatCard title="Monitoring" value="8 Kelas" icon={Eye} color="indigo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChartCard title="Statistik Kehadiran" data={chartData.kehadiranBulanan} xKey="bulan"
          bars={[{ key: 'hadir', color: '#4F46E5', name: 'Hadir' }, { key: 'izin', color: '#F59E0B', name: 'Izin' }, { key: 'alpha', color: '#EF4444', name: 'Alpha' }]} />
        <LineChartCard title="Tren Kehadiran" data={chartData.kehadiranBulanan} xKey="bulan"
          lines={[{ key: 'hadir', color: '#4F46E5', name: 'Hadir %' }]} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card><h3 className="text-base font-semibold text-gray-800 mb-4">Overview Kelas</h3>
          <Table columns={[
            { key: 'nama', header: 'Kelas' }, { key: 'waliKelas', header: 'Wali Kelas' }, { key: 'jumlahSiswa', header: 'Siswa' },
          ]} data={kelasList} keyField="id" />
        </Card>
        <Card><h3 className="text-base font-semibold text-gray-800 mb-4">Presensi Hari Ini</h3>
          <Table columns={[
            { key: 'siswaNama', header: 'Nama' }, { key: 'kelas', header: 'Kelas' }, { key: 'status', header: 'Status', render: (p: Presensi) => <Badge status={p.status} /> },
          ]} data={presensiList} keyField="id" />
        </Card>
      </div>
    </div>
  );
}