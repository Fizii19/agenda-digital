'use client';
import { Calendar, CheckCircle, Clock, BookOpen, AlertCircle } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { agendaList, jadwalList, presensiList } from '@/lib/mock-data';
import { formatTanggalPendek } from '@/lib/utils';

export default function SiswaDashboard() {
  const myPresensi = presensiList.find(p => p.siswaNama === 'Dina Permata');
  const myJadwal = jadwalList.filter(j => j.kelas === 'XII IPA 1');
  const myAgenda = agendaList.filter(a => a.kelas === 'XII IPA 1' || a.kelas === 'Semua Kelas XII');

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-800">Halo, Dina! 👋</h1><p className="text-sm text-gray-500 mt-1">Kelas XII IPA 1 • NIS: 2024001</p></div>

      {/* Quick Status */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="text-center">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-2"><CheckCircle className="w-5 h-5 text-emerald-600" /></div>
          <p className="text-xs text-gray-500">Status Hari Ini</p>
          <p className="font-semibold text-emerald-600">Hadir</p>
        </Card>
        <Card className="text-center">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-2"><Calendar className="w-5 h-5 text-blue-600" /></div>
          <p className="text-xs text-gray-500">Jadwal Hari Ini</p>
          <p className="font-semibold text-blue-600">{myJadwal.length} Mapel</p>
        </Card>
        <Card className="text-center">
          <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center mx-auto mb-2"><BookOpen className="w-5 h-5 text-purple-600" /></div>
          <p className="text-xs text-gray-500">Agenda</p>
          <p className="font-semibold text-purple-600">{myAgenda.length} Agenda</p>
        </Card>
        <Card className="text-center">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center mx-auto mb-2"><Clock className="w-5 h-5 text-amber-600" /></div>
          <p className="text-xs text-gray-500">Jam Masuk</p>
          <p className="font-semibold text-amber-600">06:55</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agenda Timeline */}
        <Card>
          <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><BookOpen className="w-4 h-4 text-[#4F46E5]" /> Timeline Agenda</h3>
          <div className="space-y-0 relative before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-gray-100">
            {myAgenda.map((a, i) => (
              <div key={a.id} className="flex gap-4 pb-4 last:pb-0 relative">
                <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 z-10 flex items-center justify-center ${i === 0 ? 'border-[#4F46E5] bg-[#4F46E5]' : 'border-gray-200 bg-white'}`}>
                  {i === 0 && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{a.judul}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{formatTanggalPendek(a.tanggal)} • {a.kategori}</p>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{a.deskripsi}</p>
                </div>
                <Badge status={a.status} />
              </div>
            ))}
          </div>
        </Card>

        {/* Jadwal Hari Ini */}
        <Card>
          <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><Calendar className="w-4 h-4 text-[#4F46E5]" /> Jadwal Hari Ini</h3>
          <div className="space-y-3">
            {myJadwal.map((j) => (
              <div key={j.id} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                <div className="text-center flex-shrink-0 w-16">
                  <p className="text-sm font-bold text-[#4F46E5]">{j.jamMulai}</p>
                  <p className="text-xs text-gray-400">{j.jamSelesai}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700">{j.mataPelajaran}</p>
                  <p className="text-xs text-gray-400">{j.guru} • {j.ruangan}</p>
                </div>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">{j.hari}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Presensi Pribadi */}
      <Card>
        <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[#4F46E5]" /> Status Presensi Saya</h3>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <div><p className="text-sm font-medium text-emerald-700">Hadir</p><p className="text-xs text-emerald-500">Status hari ini</p></div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
            <Clock className="w-5 h-5 text-gray-500" />
            <div><p className="text-sm font-medium text-gray-700">06:55 WIB</p><p className="text-xs text-gray-500">Jam masuk</p></div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
            <AlertCircle className="w-5 h-5 text-gray-500" />
            <div><p className="text-sm font-medium text-gray-700">Matematika</p><p className="text-xs text-gray-500">Mapel pertama</p></div>
          </div>
        </div>
      </Card>
    </div>
  );
}