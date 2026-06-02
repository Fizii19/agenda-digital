'use client';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function ExportPage() {
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-800">Export Laporan</h1><p className="text-sm text-gray-500 mt-1">Unduh laporan dalam berbagai format</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { title: 'Laporan Presensi Bulanan', desc: 'Format PDF', icon: FileText, color: 'bg-red-50 text-red-600' },
          { title: 'Rekap Kehadiran Excel', desc: 'Format .xlsx', icon: FileSpreadsheet, color: 'bg-green-50 text-green-600' },
          { title: 'Laporan Agenda Kelas', desc: 'Format PDF', icon: FileText, color: 'bg-blue-50 text-blue-600' },
        ].map((item, i) => (
          <Card key={i} hover className="text-center">
            <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}><item.icon className="w-6 h-6" /></div>
            <h3 className="font-semibold text-gray-800">{item.title}</h3>
            <p className="text-sm text-gray-500 mt-1 mb-4">{item.desc}</p>
            <Button variant="outline" leftIcon={<Download className="w-4 h-4" />} className="w-full justify-center">Download</Button>
          </Card>
        ))}
      </div>
    </div>
  );
}