import DashboardLayout from '@/components/layout/DashboardLayout';
import { users } from '@/lib/mock-data';

export default function SekretarisLayout({ children }: { children: React.ReactNode }) {
  const user = users.find(u => u.role === 'sekretaris')!;
  return <DashboardLayout role="sekretaris" user={user}>{children}</DashboardLayout>;
}