import DashboardLayout from '@/components/layout/DashboardLayout';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { User } from '@/lib/types';

export default async function SekretarisLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  if (!userId) {
    redirect('/');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user || user.role !== 'sekretaris') {
    redirect('/');
  }

  return <DashboardLayout role="sekretaris" user={user as unknown as User}>{children}</DashboardLayout>;
}