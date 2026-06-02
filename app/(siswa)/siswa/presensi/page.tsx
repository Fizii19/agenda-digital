'use client';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Table from '@/components/ui/Table';
import { presensiList, Presensi } from '@/lib/mock-data';
import { CheckCircle, Clock, XCircle } from 'lucide-react';

export default function SiswaPresensiPage() {
  const myPresensi = presensiList.filter(p => p.siswaNama === 'Dina Permata');
  const stats = { hadir: myPresensi.filter(p => p.status === 'Hadir').length, izin: myPresensi.filter(p => p.status === 'Izin' || p.status === 'Sakit').length, alpha: myPresensi.filter(p => p.status === 'Alpha').length };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-800">Presensi Pribadi</h1><p className="text-sm text-gray-500 mt-1">Riwayat kehadiran saya</p></div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center">
          <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-emerald-600">{stats.hadir}</p>
          <p className="text-xs text-gray-500">Hadir</p>
        </Card>
        <Card className="text-center">
          <Clock className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-amber-600">{stats.izin}</p>
          <p className="text-xs text-gray-500">Izin/Sakit</p>
        </Card>
        <Card className="text-center">
          <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-red-500">{stats.alpha}</p>
          <p className="text-xs text-gray-500">Alpha</p>
        </Card>
      </div>

      <Card padding="sm">
        <Table columns={[
          { key: 'tanggal', header: 'Tanggal' },
          { key: 'mataPelajaran', header: 'Mata Pelajaran' },
          { key: 'jamMasuk', header: 'Jam Masuk' },
          { key: 'status', header: 'Status', render: (p: Presensi) => <Badge status={p.status} /> },
          { key: 'keterangan', header: 'Keterangan' },
        ]} data={myPresensi} keyField="id" />
      </Card>
    </div>
  );
}