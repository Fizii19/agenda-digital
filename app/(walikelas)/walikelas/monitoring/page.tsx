'use client';
import Card from '@/components/ui/Card';
import { BarChartCard } from '@/components/ui/Chart';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import { chartData, agendaList, jadwalList, presensiList, Presensi } from '@/lib/mock-data';

export default function MonitoringJurnalPage() {
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-800">Monitoring Jurnal Guru</h1><p className="text-sm text-gray-500 mt-1">Pantau jurnal mengajar guru di kelas XII IPA 1</p></div>

      <BarChartCard title="Aktivitas Jurnal" data={chartData.aktivitasKelas.filter(d => d.kelas === 'XII IPA 1')} xKey="kelas"
        bars={[{ key: 'agenda', color: '#4F46E5', name: 'Agenda' }, { key: 'presensi', color: '#10B981', name: 'Presensi %' }]} height={200} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card><h3 className="text-base font-semibold text-gray-800 mb-4">Jadwal Mengajar</h3>
          <div className="space-y-2">
            {jadwalList.filter(j => j.kelas === 'XII IPA 1').map(j => (
              <div key={j.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                <div><p className="text-sm font-medium">{j.mataPelajaran}</p><p className="text-xs text-gray-400">{j.jamMulai} - {j.jamSelesai}</p></div>
                <span className="text-xs text-gray-500">{j.guru} • {j.ruangan}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card><h3 className="text-base font-semibold text-gray-800 mb-4">Presensi Terbaru</h3>
          <Table columns={[
            { key: 'siswaNama', header: 'Nama' }, { key: 'status', header: 'Status', render: (p: Presensi) => <Badge status={p.status} /> },
          ]} data={presensiList.filter(p => p.kelas === 'XII IPA 1')} keyField="id" />
        </Card>
      </div>
    </div>
  );
}