'use client';
import { LayoutDashboard, ClipboardList, UserCheck, Clock, BookOpen } from 'lucide-react';
import Card from '@/components/ui/Card';
import StatCard from '@/components/shared/StatCard';
import { chartData } from '@/lib/mock-data';

export default function GuruDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard Guru Mapel</h1>
          <p className="text-sm text-gray-500 mt-1">Selamat datang kembali, mari kelola agenda dan presensi hari ini.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Jadwal Mengajar" value="4 Sesi" icon={Clock} color="indigo" />
        <StatCard title="Agenda Input" value="12" icon={ClipboardList} trend={{ value: 15, isPositive: true }} color="emerald" />
        <StatCard title="Rata-rata Hadir" value="96.8%" icon={UserCheck} trend={{ value: 0.5, isPositive: true }} color="sky" />
        <StatCard title="Total Mapel" value="2 Mapel" icon={BookOpen} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Jadwal Hari Ini">
          <div className="space-y-4">
            {[
              { jam: '07:00 - 08:30', kelas: 'XII IPA 1', mapel: 'Fisika', ruang: 'R-302' },
              { jam: '08:45 - 10:15', kelas: 'XII IPA 2', mapel: 'Fisika', ruang: 'R-303' },
              { jam: '10:30 - 12:00', kelas: 'XI IPA 1', mapel: 'Fisika', ruang: 'R-201' },
            ].map((j, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-gray-50 bg-gray-50/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-semibold text-xs">
                    {j.jam.split(' ')[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{j.mapel}</p>
                    <p className="text-xs text-gray-500">{j.kelas} • {j.ruang}</p>
                  </div>
                </div>
                <div className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                  Mendatang
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Agenda Terakhir">
          <div className="space-y-4">
            {[
              { tgl: '12 Mei', kelas: 'XII IPA 1', agenda: 'Praktikum gerak harmonik sederhana', status: 'Selesai' },
              { tgl: '10 Mei', kelas: 'XII IPA 2', agenda: 'Ulangan Harian Bab 3', status: 'Selesai' },
              { tgl: '15 Mei', kelas: 'XI IPA 1', agenda: 'Pembahasan Tugas Mandiri', status: 'Terjadwal' },
            ].map((a, i) => (
              <div key={i} className="flex items-start gap-3 p-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#4F46E5] mt-1.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">{a.agenda}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{a.tgl} • {a.kelas}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}