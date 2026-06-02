import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatTanggalPendek(date: string): string {
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'hadir':
    case 'aktif':
    case 'selesai':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'izin':
    case 'sakit':
    case 'cuti':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'alpha':
    case 'non-aktif':
    case 'dibatalkan':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'terlambat':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'terjadwal':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'berlangsung':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

/**
 * Extracts Academic Year from NIS (e.g., "2425001" -> "2024/2025")
 * Falls back to a default value if NIS is invalid (e.g., NISN starting with 00)
 */
export function getYearFromNIS(nis?: string | null, fallbackYear: string = '2025/2026'): string {
  if (!nis || nis.startsWith('00') || nis.length < 4) {
    return fallbackYear;
  }

  try {
    const prefix = nis.substring(0, 4);
    const year1 = "20" + prefix.substring(0, 2);
    const year2 = "20" + prefix.substring(2, 4);
    
    // Simple validation: check if they are numbers
    if (isNaN(Number(year1)) || isNaN(Number(year2))) {
      return fallbackYear;
    }
    
    return `${year1}/${year2}`;
  } catch (e) {
    return fallbackYear;
  }
}