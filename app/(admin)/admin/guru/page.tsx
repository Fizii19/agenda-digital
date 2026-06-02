import prisma from '@/lib/prisma';
import GuruManagement from '@/components/shared/GuruManagement';

type GuruPageProps = {
  searchParams: Promise<{
    q?: string | string[];
    page?: string | string[];
  }>;
};

const pageSize = 25;

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function GuruPage({ searchParams }: GuruPageProps) {
  const params = await searchParams;
  const query = (getSingleParam(params.q) ?? '').trim();
  const currentPage = Math.max(Number(getSingleParam(params.page) ?? '1') || 1, 1);
  const skip = (currentPage - 1) * pageSize;
  const where = {
    role: 'guru' as const,
    ...(query
      ? {
          OR: [
            { name: { contains: query } },
            { nip: { contains: query } },
            { email: { contains: query } },
          ],
        }
      : {}),
  };

  const [guru, totalGuru] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        nip: true,
        name: true,
        email: true,
      },
      orderBy: { name: 'asc' },
      skip,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  return (
    <GuruManagement
      guru={guru.map((item) => ({
        id: item.id,
        nip: item.nip ?? '',
        name: item.name,
        email: item.email,
      }))}
      searchQuery={query}
      currentPage={currentPage}
      pageSize={pageSize}
      totalGuru={totalGuru}
    />
  );
}
