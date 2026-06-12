import type { Role } from '@/lib/types';

export const roleLabels: Record<Role, string> = {
  admin: 'Admin Sekolah',
  sekretaris: 'Sekretaris',
  walikelas: 'Wali Kelas',
  pimpinan: 'Wakasek',
  siswa: 'Siswa',
  guru: 'Guru Mapel',
};

export const roleDashboards: Record<Role, string> = {
  admin: '/admin',
  sekretaris: '/sekretaris',
  walikelas: '/walikelas',
  pimpinan: '/pimpinan',
  siswa: '/siswa',
  guru: '/guru',
};

export const protectedRoles = Object.keys(roleDashboards) as Role[];

export function uniqueRoles(primaryRole: Role, additionalRoles: Role[] = []) {
  return Array.from(new Set([primaryRole, ...additionalRoles]));
}

export function parseRolesCookie(value: string | undefined) {
  if (!value) return [];
  return value.split(',').filter((role): role is Role => protectedRoles.includes(role as Role));
}
