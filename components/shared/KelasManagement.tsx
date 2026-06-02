'use client';

import { useCallback, useEffect, useState } from 'react';
import { User, Kelas } from '@/lib/types';
import { getStudentsInKelas, getAvailableStudents, addStudentToKelas, removeStudentFromKelas } from '@/app/actions/kelas';
import Modal from '@/components/ui/Modal';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import { UserPlus, UserMinus, Search } from 'lucide-react';
import Input from '@/components/ui/Input';
import { useFeedback } from '@/components/shared/FeedbackProvider';

interface KelasManagementProps {
  kelas: Kelas;
  isOpen: boolean;
  onClose: () => void;
}

export default function KelasManagement({ kelas, isOpen, onClose }: KelasManagementProps) {
  const { notify } = useFeedback();
  const [students, setStudents] = useState<User[]>([]);
  const [availableStudents, setAvailableStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
        const [inKelas, available] = await Promise.all([
          getStudentsInKelas(kelas.nama),
          getAvailableStudents(),
        ]);
        setStudents(inKelas as User[]);
        setAvailableStudents(available as User[]);
    } catch (error) {
        console.error('Error fetching data:', error);
    } finally {
        setLoading(false);
    }
  }, [kelas.nama]);

  useEffect(() => {
    if (isOpen) {
      const timeout = window.setTimeout(() => {
        void fetchData();
      }, 0);

      return () => window.clearTimeout(timeout);
    }
  }, [fetchData, isOpen]);

  const handleAdd = async (userId: string) => {
    const res = await addStudentToKelas(userId, kelas.nama);
    if (res.success) {
        fetchData();
    } else {
        notify({ title: 'Gagal menambah siswa', message: res.error, variant: 'error' });
    }
  };

  const handleRemove = async (userId: string) => {
    const res = await removeStudentFromKelas(userId, kelas.nama);
    if (res.success) {
        fetchData();
    } else {
        notify({ title: 'Gagal menghapus siswa', message: res.error, variant: 'error' });
    }
  };

  const filteredAvailable = availableStudents.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    (s.nis && s.nis.includes(search))
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Manajemen Siswa - ${kelas.nama}`} size="lg">
      <div className="space-y-6">
        {/* Students in Class */}
        <section>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center justify-between">
            Siswa Terdaftar
            <Badge status={`${students.length} Siswa`} className="bg-indigo-50 text-[#4F46E5] border-indigo-100" />
          </h3>
          <div className="border border-gray-100 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
            <Table
              columns={[
                { key: 'name', header: 'Nama', render: (s: User) => (
                  <div>
                    <p className="font-medium text-gray-800">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.nis || s.nip || '-'}</p>
                  </div>
                )},
                { key: 'actions', header: '', render: (s: User) => (
                  <div className="flex justify-end">
                    <button onClick={() => handleRemove(s.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Keluarkan dari kelas">
                        <UserMinus className="w-4 h-4" />
                    </button>
                  </div>
                )},
              ]}
              data={students}
              keyField="id"
            />
            {students.length === 0 && !loading && <div className="p-8 text-center text-gray-400 text-sm">Belum ada siswa di kelas ini</div>}
          </div>
        </section>

        <hr className="border-gray-100" />

        {/* Add Students */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Tambah Siswa</h3>
            <div className="w-64">
              <Input 
                placeholder="Cari nama atau NIS..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
                className="py-1.5 text-xs"
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto border border-gray-100 rounded-xl">
             <Table
              columns={[
                { key: 'name', header: 'Nama', render: (s: User) => (
                  <div>
                    <p className="font-medium text-gray-800">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.nis || '-'}</p>
                  </div>
                )},
                { key: 'actions', header: '', render: (s: User) => (
                  <div className="flex justify-end">
                    <button onClick={() => handleAdd(s.id)} className="p-1.5 text-[#4F46E5] hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors" title="Tambah ke kelas">
                        <UserPlus className="w-4 h-4" />
                    </button>
                  </div>
                )},
              ]}
              data={filteredAvailable}
              keyField="id"
            />
            {filteredAvailable.length === 0 && !loading && <div className="p-8 text-center text-gray-400 text-sm">Tidak ada siswa tersedia</div>}
          </div>
        </section>
      </div>
    </Modal>
  );
}
