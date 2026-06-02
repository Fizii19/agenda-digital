'use client';
import { useState } from 'react';
import { Printer, Download } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { BarChartCard } from '@/components/ui/Chart';
import { chartData } from '@/lib/mock-data';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import { presensiList, Presensi } from '@/lib/mock-data';

export default function LaporanPage() {
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-gray-800">Cetak Laporan</h1><p className="text-sm text-gray-500 mt-1">Generate dan cetak laporan presensi</p></div>
        <div className="flex gap-2">
          <Button variant="outline" leftIcon={<Download className="w-4 h-4" />}>Export PDF</Button>
          <Button leftIcon={<Printer className="w-4 h-4" />} onClick={() => setShowPrintPreview(true)}>Print Preview</Button>
        </div>
      </div>

      <BarChartCard title="Statistik Kehadiran Bulanan" data={chartData.kehadiranBulanan} xKey="bulan"
        bars={[{ key: 'hadir', color: '#4F46E5', name: 'Hadir' }, { key: 'izin', color: '#F59E0B', name: 'Izin' }, { key: 'alpha', color: '#EF4444', name: 'Alpha' }]} />

      <Card>
        <h3 className="text-base font-semibold text-gray-800 mb-4">Laporan Presensi</h3>
        <Table columns={[
          { key: 'siswaNama', header: 'Nama' }, { key: 'kelas', header: 'Kelas' }, { key: 'tanggal', header: 'Tanggal' }, { key: 'status', header: 'Status', render: (p: Presensi) => <Badge status={p.status} /> },
        ]} data={presensiList} keyField="id" />
      </Card>

      <Modal isOpen={showPrintPreview} onClose={() => setShowPrintPreview(false)} title="Print Preview - Laporan Presensi" size="lg"
        footer={<><Button variant="ghost" onClick={() => setShowPrintPreview(false)}>Tutup</Button><Button leftIcon={<Printer className="w-4 h-4" />}>Cetak</Button></>}>
        <div className="space-y-4">
          <div className="text-center border-b pb-4"><h3 className="text-lg font-bold">LAPORAN PRESENSI SISWA</h3><p className="text-sm text-gray-500">Periode: Mei 2026</p></div>
          <Table columns={[
            { key: 'siswaNama', header: 'Nama' }, { key: 'kelas', header: 'Kelas' }, { key: 'tanggal', header: 'Tanggal' }, { key: 'status', header: 'Status', render: (p: Presensi) => <Badge status={p.status} /> },
          ]} data={presensiList} keyField="id" />
        </div>
      </Modal>
    </div>
  );
}