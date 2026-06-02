'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { Download, FileSpreadsheet, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { createSiswa, deleteSiswa, importSiswa, updateSiswa } from '@/app/actions/siswa';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import Table from '@/components/ui/Table';
import SearchFilter from '@/components/shared/SearchFilter';
import { useFeedback } from '@/components/shared/FeedbackProvider';

type SiswaRow = {
  id: string;
  nis: string;
  name: string;
  kelas: string | null;
  email: string | null;
  tahunAjaran?: string;
};

type ActionMessage = {
  type: 'success' | 'error';
  text: string;
  details?: string[];
};

interface SiswaManagementProps {
  siswa: SiswaRow[];
  kelasOptions: string[];
  searchQuery: string;
  currentPage: number;
  pageSize: number;
  totalSiswa: number;
}

export default function SiswaManagement({ siswa, kelasOptions, searchQuery, currentPage, pageSize, totalSiswa }: SiswaManagementProps) {
  const { confirm } = useFeedback();
  const router = useRouter();
  const pathname = usePathname();
  const urlSearchParams = useSearchParams();
  const [searchState, setSearchState] = useState({ value: searchQuery, source: searchQuery });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingSiswa, setEditingSiswa] = useState<SiswaRow | null>(null);
  const [message, setMessage] = useState<ActionMessage | null>(null);
  const [isAddPending, startAddTransition] = useTransition();
  const [isImportPending, startImportTransition] = useTransition();
  const [isDeletePending, startDeleteTransition] = useTransition();
  const [isSearchPending, startSearchTransition] = useTransition();
  const addFormRef = useRef<HTMLFormElement>(null);
  const importFormRef = useRef<HTMLFormElement>(null);
  const totalPages = Math.max(Math.ceil(totalSiswa / pageSize), 1);
  const firstItem = totalSiswa === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastItem = Math.min(currentPage * pageSize, totalSiswa);

  const selectOptions = useMemo(() => [
    { value: '', label: 'Tanpa Kelas' },
    ...kelasOptions.map((kelas) => ({ value: kelas, label: kelas }))
  ], [kelasOptions]);

  const buildUrl = useCallback((params: URLSearchParams) => {
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname]);

  if (searchState.source !== searchQuery) {
    setSearchState({ value: searchQuery, source: searchQuery });
  }

  const search = searchState.source === searchQuery ? searchState.value : searchQuery;
  const setSearch = (value: string) => setSearchState({ value, source: searchQuery });

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const query = search.trim();
      if (query === searchQuery) return;

      const params = new URLSearchParams(urlSearchParams.toString());
      if (query) {
        params.set('q', query);
      } else {
        params.delete('q');
      }
      params.delete('page');

      startSearchTransition(() => {
        router.replace(buildUrl(params), { scroll: false });
      });
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [buildUrl, router, search, searchQuery, urlSearchParams]);

  const goToPage = (page: number) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    const params = new URLSearchParams(urlSearchParams.toString());

    if (nextPage > 1) {
      params.set('page', String(nextPage));
    } else {
      params.delete('page');
    }

    startSearchTransition(() => {
      router.replace(buildUrl(params), { scroll: false });
    });
  };

  const handleCreateOrUpdate = (formData: FormData) => {
    setMessage(null);
    startAddTransition(async () => {
      const result = editingSiswa
        ? await updateSiswa(editingSiswa.id, formData)
        : await createSiswa(formData);
        
      setMessage({ type: result.success ? 'success' : 'error', text: result.message });

      if (result.success) {
        addFormRef.current?.reset();
        setShowAddModal(false);
        setEditingSiswa(null);
      }
    });
  };

  const handleDelete = async (id: string) => {
    const shouldDelete = await confirm({
      title: 'Hapus siswa?',
      message: 'Data siswa ini akan dihapus dari daftar dan tidak bisa dikembalikan.',
      confirmText: 'Hapus',
      cancelText: 'Batal',
      tone: 'danger',
    });

    if (!shouldDelete) return;

    setMessage(null);
    startDeleteTransition(async () => {
      const result = await deleteSiswa(id);
      setMessage({ type: result.success ? 'success' : 'error', text: result.message });
    });
  };

  const handleOpenEdit = (item: SiswaRow) => {
    setEditingSiswa(item);
    setShowAddModal(true);
  };

  const handleOpenAdd = () => {
    setEditingSiswa(null);
    setShowAddModal(true);
  };

  const handleImport = (formData: FormData) => {
    setMessage(null);
    startImportTransition(async () => {
      const result = await importSiswa(formData);
      setMessage({
        type: result.success ? 'success' : 'error',
        text: result.message,
        details: result.errors,
      });

      if (result.imported || result.updated) {
        importFormRef.current?.reset();
      }
    });
  };

  const downloadCsvTemplate = () => {
    const csv = [
      ['no', 'nama', 'nis', 'jk', 'nisn', 'tempat_lahir', 'tanggal_lahir', 'alamat', 'rt', 'rw', 'kelurahan', 'kecamatan', 'telepon', 'email', 'kelas'],
      ['1', 'Nama Siswa', '2526100001', 'L', '0099999999', 'Banjar', '2009-01-01', '-', '0', '0', '-', '-', '081234567890', 'siswa@example.com', '10 RPL 1'],
    ].map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');

    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'contoh-import-siswa.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manajemen Siswa</h1>
          <p className="mt-1 text-sm text-gray-500">Kelola data siswa dari database sekolah</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" leftIcon={<Upload className="h-4 w-4" />} onClick={() => setShowImportModal(true)}>
            Import
          </Button>
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={handleOpenAdd}>
            Tambah Siswa
          </Button>
        </div>
      </div>

      {message && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${message.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
          <p className="font-medium">{message.text}</p>
          {message.details && message.details.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
              {message.details.map((detail) => <li key={detail}>{detail}</li>)}
            </ul>
          )}
        </div>
      )}

      <SearchFilter
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Cari siswa, NIS, kelas, atau email..."
        onExport={downloadCsvTemplate}
        exportLabel="Contoh CSV"
      />

      <Card padding="sm">
        <div className="mb-3 flex flex-col gap-2 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
          <span>{isSearchPending ? 'Memuat data...' : `Menampilkan ${firstItem}-${lastItem} dari ${totalSiswa} siswa`}</span>
          <span>Halaman {currentPage} dari {totalPages}</span>
        </div>
        <Table
          columns={[
            { key: 'nis', header: 'NIS' },
            { key: 'name', header: 'Nama', render: (item: SiswaRow) => <span className="font-medium text-gray-800">{item.name}</span> },
            { key: 'kelas', header: 'Kelas', render: (item: SiswaRow) => item.kelas ? <Badge status={item.kelas} className="bg-gray-100 text-gray-600 border-gray-200" /> : <span className="text-gray-400">-</span> },
            { key: 'tahunAjaran', header: 'Tahun Ajaran', render: (item: SiswaRow) => <span className="text-gray-600">{item.tahunAjaran || '-'}</span> },
            { key: 'email', header: 'Email', render: (item: SiswaRow) => item.email || <span className="text-gray-400">-</span> },
            { key: 'status', header: 'Status', render: () => <Badge status="Aktif" /> },
            {
              key: 'actions',
              header: 'Aksi',
              render: (item: SiswaRow) => (
                <div className="flex gap-1.5">
                  <button type="button" onClick={() => handleOpenEdit(item)} className="p-1.5 rounded-lg text-gray-400 transition-colors hover:bg-indigo-50 hover:text-[#4F46E5]" title="Edit">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => handleDelete(item.id)} disabled={isDeletePending} className="p-1.5 rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500" title="Hapus">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ),
            },
          ]}
          data={siswa}
          keyField="id"
          emptyMessage="Belum ada data siswa"
        />
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="outline" size="sm" type="button" disabled={currentPage <= 1 || isSearchPending} onClick={() => goToPage(currentPage - 1)}>
            Sebelumnya
          </Button>
          <div className="flex justify-center gap-1">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, index) => {
              const start = Math.max(Math.min(currentPage - 2, totalPages - 4), 1);
              const page = start + index;
              if (page > totalPages) return null;

              return (
                <button
                  key={page}
                  type="button"
                  onClick={() => goToPage(page)}
                  className={`h-8 min-w-8 rounded-lg px-2 text-sm font-medium transition-colors ${page === currentPage ? 'bg-[#4F46E5] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  {page}
                </button>
              );
            })}
          </div>
          <Button variant="outline" size="sm" type="button" disabled={currentPage >= totalPages || isSearchPending} onClick={() => goToPage(currentPage + 1)}>
            Berikutnya
          </Button>
        </div>
      </Card>

      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingSiswa(null);
        }}
        title={editingSiswa ? 'Edit Siswa' : 'Tambah Siswa'}
        footer={
          <>
            <Button variant="ghost" type="button" onClick={() => {
              setShowAddModal(false);
              setEditingSiswa(null);
            }}>Batal</Button>
            <Button type="submit" form="add-siswa-form" isLoading={isAddPending}>Simpan</Button>
          </>
        }
      >
        <form id="add-siswa-form" ref={addFormRef} action={handleCreateOrUpdate} className="space-y-4">
          <Input label="Nama Siswa" name="name" defaultValue={editingSiswa?.name} placeholder="Masukkan nama lengkap" required />
          <Input label="NIS" name="nis" defaultValue={editingSiswa?.nis} placeholder="Contoh: 2526100001" required />
          <Input label="Email" name="email" type="email" defaultValue={editingSiswa?.email || ''} placeholder="siswa@example.com" />
          <Select label="Kelas" name="kelas" defaultValue={editingSiswa?.kelas || ''} options={selectOptions} />
          <p className="text-[10px] text-gray-400 italic">* Tahun ajaran akan otomatis mengikuti kelas yang dipilih.</p>
        </form>
      </Modal>


      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import Data Siswa"
        footer={
          <>
            <Button variant="ghost" type="button" onClick={() => setShowImportModal(false)}>Tutup</Button>
            <Button type="submit" form="import-siswa-form" isLoading={isImportPending} leftIcon={<FileSpreadsheet className="h-4 w-4" />}>Import</Button>
          </>
        }
      >
        <form id="import-siswa-form" ref={importFormRef} action={handleImport} className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
            Format mengikuti file contoh Dapodik: kolom B nama, C NIS, N email, dan O kelas. File CSV juga didukung dengan header nama, nis, email, kelas.
          </div>
          <Input label="File CSV/XLSX" name="file" type="file" accept=".csv,.xlsx" required />
          <Button type="button" variant="outline" leftIcon={<Download className="h-4 w-4" />} onClick={downloadCsvTemplate}>
            Download Contoh CSV
          </Button>
        </form>
      </Modal>
    </div>
  );
}
