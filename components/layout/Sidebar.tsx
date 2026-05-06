'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Role } from '@/lib/types';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, Calendar, Monitor, ClipboardList,
  UserCheck, FileText, Printer, BarChart3, Eye, Clock, CheckSquare, School, X,
} from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  role: Role;
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  icon: React.ElementType;
  label: string;
  href: string;
  roles: Role[];
}

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '', roles: ['admin', 'sekretaris', 'walikelas', 'pimpinan', 'siswa'] },
  { icon: School, label: 'Manajemen Kelas', href: '/kelas', roles: ['admin'] },
  { icon: Users, label: 'Manajemen Guru', href: '/guru', roles: ['admin'] },
  { icon: GraduationCap, label: 'Manajemen Siswa', href: '/siswa', roles: ['admin'] },
  { icon: BookOpen, label: 'Mata Pelajaran', href: '/mapel', roles: ['admin'] },
  { icon: Calendar, label: 'Jadwal Pelajaran', href: '/jadwal', roles: ['admin'] },
  { icon: Monitor, label: 'Monitoring Kelas', href: '/monitoring', roles: ['admin', 'pimpinan'] },
  { icon: ClipboardList, label: 'Input Agenda', href: '/agenda', roles: ['sekretaris'] },
  { icon: UserCheck, label: 'Presensi Siswa', href: '/presensi', roles: ['sekretaris'] },
  { icon: Printer, label: 'Cetak Laporan', href: '/laporan', roles: ['sekretaris'] },
  { icon: FileText, label: 'Laporan Presensi', href: '/laporan', roles: ['walikelas'] },
  { icon: Eye, label: 'Monitoring Jurnal', href: '/monitoring', roles: ['walikelas'] },
  { icon: BarChart3, label: 'Statistik', href: '/statistik', roles: ['pimpinan'] },
  { icon: Clock, label: 'Agenda Kelas', href: '/agenda', roles: ['siswa'] },
  { icon: CheckSquare, label: 'Presensi Pribadi', href: '/presensi', roles: ['siswa'] },
];

function getRoleBasePath(role: Role): string {
  const mapping: Record<Role, string> = { admin: '/admin', sekretaris: '/sekretaris', walikelas: '/walikelas', pimpinan: '/pimpinan', siswa: '/siswa' };
  return mapping[role];
}

export default function Sidebar({ role, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const basePath = getRoleBasePath(role);
  const filteredItems = menuItems.filter((item) => item.roles.includes(role));

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={onClose} />}
      <aside className={cn('fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto', isOpen ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex items-center justify-between px-5 py-5 border-b border-gray-50">
          <Link href={basePath} className="flex items-center gap-3" onClick={onClose}>
            <div className="w-9 h-9 bg-[#4F46E5] rounded-xl flex items-center justify-center"><School className="w-5 h-5 text-white" /></div>
            <span className="font-bold text-gray-800 text-lg">EduAgenda</span>
          </Link>
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {filteredItems.map((item) => {
            const href = item.href ? `${basePath}${item.href}` : basePath;
            const isActive = pathname === href || (item.href === '' && pathname === basePath);
            return (
              <Link key={item.label + item.href} href={href} onClick={onClose}
                className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200', isActive ? 'bg-indigo-50 text-[#4F46E5]' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800')}>
                <item.icon className="w-4.5 h-4.5" /> {item.label}
              </Link>
            );
          })}
        </div>
        <div className="p-4 border-t border-gray-50">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50">
            <div className="w-8 h-8 bg-[#4F46E5] rounded-full flex items-center justify-center text-white text-xs font-bold">{role[0].toUpperCase()}</div>
            <div><p className="text-sm font-medium text-gray-700 capitalize">{role}</p><p className="text-xs text-gray-400">Online</p></div>
          </div>
        </div>
      </aside>
    </>
  );
}