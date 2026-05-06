import DashboardLayout from '@/components/layout/DashboardLayout';
import { users } from '@/lib/mock-data';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const adminUser = users.find(u => u.role === 'admin')!;
  return <DashboardLayout role="admin" user={adminUser}>{children}</DashboardLayout>;
}