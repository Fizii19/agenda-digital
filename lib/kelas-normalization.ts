export const tingkatOptions = [10, 11, 12] as const;

export const jurusanOptions = ['PPLG', 'DKV', 'AK', 'MP', 'BD', 'PF', 'DPB'] as const;

const jurusanAliasMap: Record<string, string> = {
  RPL: 'PPLG',
  PPLG: 'PPLG',
  DKV: 'DKV',
  AKL: 'AK',
  AK: 'AK',
  BDP: 'BD',
  BD: 'BD',
  MPLB: 'MP',
  MP: 'MP',
  TBS: 'DPB',
  DPB: 'DPB',
  BCF: 'PF',
  PF: 'PF',
};

export type ParsedKelasName = {
  nama: string;
  tingkat: number;
  jurusan: string;
};

export function normalizeJurusan(value: string) {
  const cleaned = value.trim().toUpperCase();
  return jurusanAliasMap[cleaned] ?? cleaned;
}

export function parseKelasName(value: string): ParsedKelasName | null {
  const cleaned = value.trim().replace(/\s+/g, ' ').toUpperCase();
  const match = cleaned.match(/^(10|11|12)\s+([A-Z]+)(?:\s+(.+))?$/);

  if (!match) return null;

  const tingkat = Number(match[1]);
  const jurusan = normalizeJurusan(match[2]);
  const suffix = match[3]?.trim();
  const nama = [tingkat, jurusan, suffix].filter(Boolean).join(' ');

  return { nama, tingkat, jurusan };
}

export function normalizeKelasName(value: string | null) {
  if (!value) return null;

  const parsed = parseKelasName(value);
  return parsed?.nama ?? value.trim().replace(/\s+/g, ' ').toUpperCase();
}
