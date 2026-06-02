'use client';
import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import { Agenda } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { Calendar, Clock } from 'lucide-react';
import { getAgendas } from '@/app/actions/agenda';

export default function SiswaAgendaPage() {
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAgendas() {
      setIsLoading(true);
      const data = await getAgendas('XII IPA 1');
      setAgendas(data as Agenda[]);
      setIsLoading(false);
    }
    fetchAgendas();
  }, []);

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Memuat agenda kelas...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Agenda Kelas</h1>
        <p className="text-sm text-gray-500 mt-1">Daftar kegiatan harian kelas XII IPA 1</p>
      </div>
      
      <div className="space-y-8">
        {agendas.length === 0 ? (
          <div className="p-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <p className="text-gray-500">Belum ada agenda untuk kelas ini.</p>
          </div>
        ) : (
          agendas.map((agenda) => (
            <div key={agenda.id} className="space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                <Calendar className="w-5 h-5 text-[#4F46E5]" />
                <h2 className="text-lg font-bold text-gray-800">{formatDate(agenda.tanggal)}</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agenda.items?.map((item, idx) => (
                  <Card key={idx} hover className="relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#4F46E5]" />
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-1.5 text-[#4F46E5] bg-indigo-50 px-2 py-1 rounded-lg text-xs font-bold">
                        <Clock className="w-3 h-3" />
                        {item.jamMulai} - {item.jamSelesai}
                      </div>
                    </div>
                    <h3 className="font-bold text-gray-800 mb-1 group-hover:text-[#4F46E5] transition-colors">{item.kegiatan}</h3>
                    {item.keterangan && <p className="text-sm text-gray-500">{item.keterangan}</p>}
                  </Card>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
