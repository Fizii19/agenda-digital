'use client';
import { useState } from 'react';
import Card from '@/components/ui/Card';
import { jadwalList } from '@/lib/mock-data';
import { Clock } from 'lucide-react';

export default function SiswaJadwalPage() {
  const hari = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const [selectedHari, setSelectedHari] = useState('Senin');
  const myJadwal = jadwalList.filter(j => j.kelas === 'XII IPA 1' && j.hari === selectedHari);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-800">Jadwal Pelajaran</h1><p className="text-sm text-gray-500 mt-1">Kelas XII IPA 1</p></div>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {hari.map(h => (
          <button key={h} onClick={() => setSelectedHari(h)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedHari === h ? 'bg-[#4F46E5] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-[#4F46E5]'}`}>{h}</button>
        ))}
      </div>
      <div className="space-y-3">
        {myJadwal.length === 0 ? <Card><p className="text-center text-gray-400 py-8">Tidak ada jadwal untuk hari {selectedHari}</p></Card> :
          myJadwal.map(j => (
            <Card key={j.id} hover>
              <div className="flex items-center gap-4">
                <div className="text-center flex-shrink-0 w-20 p-3 bg-indigo-50 rounded-xl">
                  <p className="text-lg font-bold text-[#4F46E5]">{j.jamMulai}</p>
                  <p className="text-xs text-gray-400 flex items-center justify-center gap-1"><Clock className="w-3 h-3" />{j.jamSelesai}</p>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{j.mataPelajaran}</p>
                  <p className="text-sm text-gray-500">{j.guru}</p>
                </div>
                <span className="text-sm text-gray-400 bg-gray-100 px-3 py-1.5 rounded-xl">{j.ruangan}</span>
              </div>
            </Card>
          ))
        }
      </div>
    </div>
  );
}