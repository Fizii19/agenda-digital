import prisma from '@/lib/prisma';
import SiswaManagement from '@/components/shared/SiswaManagement';

type SiswaPageProps = {
  searchParams: Promise<{
    q?: string | string[];
    page?: string | string[];
  }>;
};

const pageSize = 25;

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SiswaPage({ searchParams }: SiswaPageProps) {
  const params = await searchParams;
  const query = (getSingleParam(params.q) ?? '').trim();
  const currentPage = Math.max(Number(getSingleParam(params.page) ?? '1') || 1, 1);
  const skip = (currentPage - 1) * pageSize;
  const where = {
    role: 'siswa' as const,
    ...(query
      ? {
          OR: [
            { name: { contains: query } },
            { nis: { contains: query } },
            { kelas: { contains: query } },
            { email: { contains: query } },
          ],
        }
      : {}),
  };

  const [siswa, totalSiswa, kelasData] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        nis: true,
        name: true,
        kelas: true,
        email: true,
      },
      orderBy: { name: 'asc' },
      skip,
      take: pageSize,
    }),
    prisma.user.count({ where }),
    prisma.kelas.findMany({
      select: { 
        nama: true,
        tahunAjaran: true 
      },
      orderBy: [{ tingkat: 'asc' }, { nama: 'asc' }],
    }),
  ]);

  // Create a map of kelas nama to tahunAjaran for quick lookup
  const kelasTahunMap = new Map(kelasData.map(k => [k.nama, k.tahunAjaran]));

  const siswaWithTahun = siswa.map(s => ({
    ...s,
    tahunAjaran: s.kelas ? kelasTahunMap.get(s.kelas) || '-' : '-'
  }));

  const kelasOptions = kelasData.map((item) => item.nama).sort();

  return (
    <SiswaManagement
      siswa={siswaWithTahun.map((item) => ({
        id: item.id,
        nis: item.nis ?? '',
        name: item.name,
        kelas: item.kelas,
        email: item.email,
        tahunAjaran: item.tahunAjaran,
      }))}
      kelasOptions={kelasOptions}
      searchQuery={query}
      currentPage={currentPage}
      pageSize={pageSize}
      totalSiswa={totalSiswa}
    />
  );
}
