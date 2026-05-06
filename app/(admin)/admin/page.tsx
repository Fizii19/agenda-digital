'use client';
import { School, Users, GraduationCap, CheckCircle, TrendingUp, Clock } from 'lucide-react';
import StatCard from '@/components/shared/StatCard';
import Card from '@/components/ui/Card';
import { BarChartCard } from '@/components/ui/Chart';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import { dashboardStats, chartData, agendaList, kelasList } from '@/lib/mock-data';
import { formatTanggalPendek } from '@/lib/utils';

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard Admin</h1>
        <p className="text-sm text-gray-500 mt-1">Selamat datang kembali! Berikut ringkasan data sekolah hari ini.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Kelas" value={dashboardStats.totalKelas} icon={School} color="indigo" trend={{ value: 12, isPositive: true }} />
        <StatCard title="Total Guru" value={dashboardStats.totalGuru} icon={Users} color="emerald" trend={{ value: 5, isPositive: true }} />
        <StatCard title="Total Siswa" value={dashboardStats.totalSiswa} icon={GraduationCap} color="sky" trend={{ value: 8, isPositive: true }} />
        <StatCard title="Kehadiran Hari Ini" value={`${dashboardStats.persentaseKehadiran}%`} icon={CheckCircle} color="amber" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChartCard title="Statistik Kehadiran Bulanan" data={chartData.kehadiranBulanan} xKey="bulan"
          bars={[{ key: 'hadir', color: '#4F46E5', name: 'Hadir' }, { key: 'izin', color: '#F59E0B', name: 'Izin' }, { key: 'alpha', color: '#EF4444', name: 'Alpha' }]} />
        <BarChartCard title="Aktivitas Per Kelas" data={chartData.aktivitasKelas} xKey="kelas"
          bars={[{ key: 'agenda', color: '#4F46E5', name: 'Agenda' }, { key: 'presensi', color: '#10B981', name: 'Presensi %' }]} />
      </div>

      {/* Recent Agenda & Kelas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-base font-semibold text-gray-800 mb-4">Agenda Terbaru</h3>
          <div className="space-y-3">
            {agendaList.slice(0, 5).map((a) => (
              <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#4F46E5]" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">{a.judul}</p>
                    <p className="text-xs text-gray-400">{a.kelas} • {formatTanggalPendek(a.tanggal)}</p>
                  </div>
                </div>
                <Badge status={a.status} />
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h3 className="text-base font-semibold text-gray-800 mb-4">Daftar Kelas</h3>
          <Table
            columns={[
              { key: 'nama', header: 'Kelas' },
              { key: 'waliKelas', header: 'Wali Kelas' },
              { key: 'jumlahSiswa', header: 'Siswa' },
            ]}
            data={kelasList.slice(0, 5)}
            keyField="id"
          />
        </Card>
      </div>
    </div>
  );
}