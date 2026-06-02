'use client';
import { BarChartCard, LineChartCard } from '@/components/ui/Chart';
import StatCard from '@/components/shared/StatCard';
import { School, Users, CheckCircle, TrendingUp } from 'lucide-react';
import { chartData, dashboardStats } from '@/lib/mock-data';

export default function StatistikPage() {
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-800">Statistik Kehadiran</h1><p className="text-sm text-gray-500 mt-1">Analisis kehadiran seluruh sekolah</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard title="Kehadiran" value={`${dashboardStats.persentaseKehadiran}%`} icon={CheckCircle} color="emerald" />
        <StatCard title="Total Siswa" value={dashboardStats.totalSiswa} icon={Users} color="sky" />
        <StatCard title="Total Kelas" value={dashboardStats.totalKelas} icon={School} color="indigo" />
        <StatCard title="Tren" value="+2.1%" icon={TrendingUp} color="emerald" />
      </div>
      <BarChartCard title="Kehadiran Bulanan" data={chartData.kehadiranBulanan} xKey="bulan"
        bars={[{ key: 'hadir', color: '#4F46E5', name: 'Hadir' }, { key: 'izin', color: '#F59E0B', name: 'Izin' }, { key: 'alpha', color: '#EF4444', name: 'Alpha' }]} height={350} />
      <LineChartCard title="Tren Kehadiran 6 Bulan" data={chartData.kehadiranBulanan} xKey="bulan"
        lines={[{ key: 'hadir', color: '#4F46E5', name: 'Hadir %' }]} height={300} />
    </div>
  );
}