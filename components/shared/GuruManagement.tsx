'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { Download, FileSpreadsheet, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { createGuru, deleteGuru, importGuru, updateGuru } from '@/app/actions/guru';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Table from '@/components/ui/Table';
import SearchFilter from '@/components/shared/SearchFilter';

type GuruRow = {
  id: string;
  nip: string;
  name: string;
  email: string | null;
};

type ActionMessage = {
  type: 'success' | 'error';
  text: string;
  details?: string[];
};

interface GuruManagementProps {
  guru: GuruRow[];
  searchQuery: string;
  currentPage: number;
  pageSize: number;
  totalGuru: number;
}

export default function GuruManagement({ guru, searchQuery, currentPage, pageSize, totalGuru }: GuruManagementProps) {
  const router = useRouter();
  const pathname = usePathname();
  const urlSearchParams = useSearchParams();
  const [searchState, setSearchState] = useState({ value: searchQuery, source: searchQuery });
  const [showFormModal, setShowFormModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [deletingGuru, setDeletingGuru] = useState<GuruRow | null>(null);
  const [editingGuru, setEditingGuru] = useState<GuruRow | null>(null);
  const [message, setMessage] = useState<ActionMessage | null>(null);
  const [isSavePending, startSaveTransition] = useTransition();
  const [isImportPending, startImportTransition] = useTransition();
  const [isDeletePending, startDeleteTransition] = useTransition();
  const [isSearchPending, startSearchTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const importFormRef = useRef<HTMLFormElement>(null);
  const totalPages = Math.max(Math.ceil(totalGuru / pageSize), 1);
  const firstItem = totalGuru === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastItem = Math.min(currentPage * pageSize, totalGuru);

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

  const pageNumbers = useMemo(() => {
    const start = Math.max(Math.min(currentPage - 2, totalPages - 4), 1);
    return Array.from({ length: Math.min(totalPages, 5) }, (_, index) => start + index).filter((page) => page <= totalPages);
  }, [currentPage, totalPages]);

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

  const openAddModal = () => {
    setEditingGuru(null);
    setShowFormModal(true);
  };

  const openEditModal = (item: GuruRow) => {
    setEditingGuru(item);
    setShowFormModal(true);
  };

  const handleSave = (formData: FormData) => {
    setMessage(null);
    startSaveTransition(async () => {
      const result = editingGuru ? await updateGuru(formData) : await createGuru(formData);
      setMessage({ type: result.success ? 'success' : 'error', text: result.message });

      if (result.success) {
        formRef.current?.reset();
        setEditingGuru(null);
        setShowFormModal(false);
      }
    });
  };

  const handleImport = (formData: FormData) => {
    setMessage(null);
    startImportTransition(async () => {
      const result = await importGuru(formData);
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

  const handleDelete = () => {
    if (!deletingGuru) return;

    const formData = new FormData();
    formData.set('id', deletingGuru.id);
    setMessage(null);

    startDeleteTransition(async () => {
      const result = await deleteGuru(formData);
      setMessage({ type: result.success ? 'success' : 'error', text: result.message });

      if (result.success) {
        setDeletingGuru(null);
      }
    });
  };

  const downloadCsvTemplate = () => {
    const csv = [
      ['nama', 'nip', 'email'],
      ['Nama Guru', '198601012010011001', 'guru@example.com'],
    ].map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');

    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'contoh-import-guru.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manajemen Guru</h1>
          <p className="mt-1 text-sm text-gray-500">Kelola data guru dari database sekolah</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" leftIcon={<Upload className="h-4 w-4" />} onClick={() => setShowImportModal(true)}>
            Import
          </Button>
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openAddModal}>
            Tambah Guru
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
        searchPlaceholder="Cari guru, NIP, atau email..."
        onExport={downloadCsvTemplate}
        exportLabel="Contoh CSV"
      />

      <Card padding="sm">
        <div className="mb-3 flex flex-col gap-2 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
          <span>{isSearchPending ? 'Memuat data...' : `Menampilkan ${firstItem}-${lastItem} dari ${totalGuru} guru`}</span>
          <span>Halaman {currentPage} dari {totalPages}</span>
        </div>
        <Table
          columns={[
            { key: 'nip', header: 'NIP', render: (item: GuruRow) => item.nip || <span className="text-gray-400">-</span> },
            { key: 'name', header: 'Nama', render: (item: GuruRow) => <span className="font-medium text-gray-800">{item.name}</span> },
            { key: 'email', header: 'Email', render: (item: GuruRow) => item.email || <span className="text-gray-400">-</span> },
            { key: 'status', header: 'Status', render: () => <Badge status="Aktif" /> },
            {
              key: 'actions',
              header: 'Aksi',
              render: (item: GuruRow) => (
                <div className="flex gap-1.5">
                  <button type="button" onClick={() => openEditModal(item)} className="p-1.5 rounded-lg text-gray-400 transition-colors hover:bg-indigo-50 hover:text-[#4F46E5]">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => setDeletingGuru(item)} className="p-1.5 rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ),
            },
          ]}
          data={guru}
          keyField="id"
          emptyMessage="Belum ada data guru"
        />
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="outline" size="sm" type="button" disabled={currentPage <= 1 || isSearchPending} onClick={() => goToPage(currentPage - 1)}>
            Sebelumnya
          </Button>
          <div className="flex justify-center gap-1">
            {pageNumbers.map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => goToPage(page)}
                className={`h-8 min-w-8 rounded-lg px-2 text-sm font-medium transition-colors ${page === currentPage ? 'bg-[#4F46E5] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                {page}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" type="button" disabled={currentPage >= totalPages || isSearchPending} onClick={() => goToPage(currentPage + 1)}>
            Berikutnya
          </Button>
        </div>
      </Card>

      <Modal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        title={editingGuru ? 'Edit Guru' : 'Tambah Guru'}
        footer={
          <>
            <Button variant="ghost" type="button" onClick={() => setShowFormModal(false)}>Batal</Button>
            <Button type="submit" form="guru-form" isLoading={isSavePending}>Simpan</Button>
          </>
        }
      >
        <form id="guru-form" key={editingGuru?.id ?? 'new'} ref={formRef} action={handleSave} className="space-y-4">
          {editingGuru && <input type="hidden" name="id" value={editingGuru.id} />}
          <Input label="Nama Guru" name="name" placeholder="Masukkan nama lengkap" defaultValue={editingGuru?.name} required />
          <Input label="NIP" name="nip" placeholder="Contoh: 198601012010011001" defaultValue={editingGuru?.nip} required />
          <Input label="Email" name="email" type="email" placeholder="guru@example.com" defaultValue={editingGuru?.email ?? ''} />
        </form>
      </Modal>

      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import Data Guru"
        footer={
          <>
            <Button variant="ghost" type="button" onClick={() => setShowImportModal(false)}>Tutup</Button>
            <Button type="submit" form="import-guru-form" isLoading={isImportPending} leftIcon={<FileSpreadsheet className="h-4 w-4" />}>Import</Button>
          </>
        }
      >
        <form id="import-guru-form" ref={importFormRef} action={handleImport} className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
            Format CSV/XLSX: kolom A nama, B NIP, dan C email. CSV juga bisa memakai header nama, nip, email.
          </div>
          <Input label="File CSV/XLSX" name="file" type="file" accept=".csv,.xlsx" required />
          <Button type="button" variant="outline" leftIcon={<Download className="h-4 w-4" />} onClick={downloadCsvTemplate}>
            Download Contoh CSV
          </Button>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(deletingGuru)}
        onClose={() => setDeletingGuru(null)}
        title="Hapus Guru"
        size="sm"
        footer={
          <>
            <Button variant="ghost" type="button" onClick={() => setDeletingGuru(null)}>Batal</Button>
            <Button variant="danger" type="button" isLoading={isDeletePending} onClick={handleDelete}>Hapus</Button>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          Hapus data guru <span className="font-medium text-gray-800">{deletingGuru?.name}</span>? Tindakan ini tidak bisa dibatalkan.
        </p>
      </Modal>
    </div>
  );
}
