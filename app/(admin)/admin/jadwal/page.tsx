'use client';
import { useState } from 'react';
import { Plus, Clock } from 'lucide-react';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import SearchFilter from '@/components/shared/SearchFilter';
import { jadwalList, Jadwal } from '@/lib/mock-data';

export default function JadwalPage() {
  const [search, setSearch] = useState('');
  const hari = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const [selectedHari, setSelectedHari] = useState('Senin');
  const filtered = jadwalList.filter(j => j.hari === selectedHari && (j.kelas.toLowerCase().includes(search.toLowerCase()) || j.mataPelajaran.toLowerCase().includes(search.toLowerCase())));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-gray-800">Jadwal Pelajaran</h1><p className="text-sm text-gray-500 mt-1">Atur jadwal pelajaran per kelas</p></div>
        <Button leftIcon={<Plus className="w-4 h-4" />}>Tambah Jadwal</Button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {hari.map(h => (
          <button key={h} onClick={() => setSelectedHari(h)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${selectedHari === h ? 'bg-[#4F46E5] text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:border-[#4F46E5] hover:text-[#4F46E5]'}`}>{h}</button>
        ))}
      </div>
      <SearchFilter searchValue={search} onSearchChange={setSearch} />
      <Card padding="sm">
        <Table columns={[
          { key: 'kelas', header: 'Kelas', render: (j: Jadwal) => <span className="font-medium">{j.kelas}</span> },
          { key: 'jamMulai', header: 'Jam', render: (j: Jadwal) => <span className="flex items-center gap-1 text-gray-600"><Clock className="w-3 h-3" />{j.jamMulai} - {j.jamSelesai}</span> },
          { key: 'mataPelajaran', header: 'Mata Pelajaran' },
          { key: 'guru', header: 'Guru' },
          { key: 'ruangan', header: 'Ruangan', render: (j: Jadwal) => <Badge status={j.ruangan} className="bg-gray-100 text-gray-600 border-gray-200" /> },
        ]} data={filtered} keyField="id" />
      </Card>
    </div>
  );
}