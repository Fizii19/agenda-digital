'use client';
import { ClipboardList, CheckCircle, Clock, FileText, Plus } from 'lucide-react';
import StatCard from '@/components/shared/StatCard';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { agendaList, Agenda } from '@/lib/mock-data';
import { formatTanggalPendek } from '@/lib/utils';
import Link from 'next/link';

export default function SekretarisDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-gray-800">Dashboard Sekretaris</h1><p className="text-sm text-gray-500 mt-1">Kelola agenda dan presensi kelas</p></div>
        <Link href="/sekretaris/agenda"><Button leftIcon={<Plus className="w-4 h-4" />}>Input Agenda Baru</Button></Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Agenda" value={agendaList.length} icon={ClipboardList} color="indigo" />
        <StatCard title="Agenda Selesai" value={1} icon={CheckCircle} color="emerald" />
        <StatCard title="Agenda Terjadwal" value={4} icon={Clock} color="sky" />
        <StatCard title="Laporan Bulanan" value={3} icon={FileText} color="amber" />
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-800">Daftar Agenda Kelas</h3>
          <Link href="/sekretaris/agenda"><Button variant="outline" size="sm">Lihat Semua</Button></Link>
        </div>
        <Table columns={[
          { key: 'judul', header: 'Judul Agenda', render: (a: Agenda) => <span className="font-medium">{a.judul}</span> },
          { key: 'kelas', header: 'Kelas' },
          { key: 'kategori', header: 'Kategori', render: (a: Agenda) => <Badge status={a.kategori} /> },
          { key: 'tanggal', header: 'Tanggal', render: (a: Agenda) => formatTanggalPendek(a.tanggal) },
          { key: 'status', header: 'Status', render: (a: Agenda) => <Badge status={a.status} /> },
        ]} data={agendaList} keyField="id" />
      </Card>
    </div>
  );
}