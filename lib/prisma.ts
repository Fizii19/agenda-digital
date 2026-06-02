import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from './generated/client/client';

const prismaClientSingleton = () => {
  const adapter = new PrismaMariaDb({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'agenda_kelas_digital',
    connectionLimit: 5,
  });

  return new PrismaClient({ adapter });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

function hasCurrentDelegates(client: ReturnType<typeof prismaClientSingleton> | undefined) {
  if (!client) return false;

  const delegates = client as unknown as Record<string, unknown>;
  return Boolean(delegates.kelas && delegates.user && delegates.tahunajaran && delegates.ruangan && delegates.subject && delegates.schedule);
}

if (!hasCurrentDelegates(globalThis.prisma)) {
  void globalThis.prisma?.$disconnect().catch(() => undefined);
  globalThis.prisma = prismaClientSingleton();
}

const prisma = globalThis.prisma as ReturnType<typeof prismaClientSingleton>;

export default prisma;
