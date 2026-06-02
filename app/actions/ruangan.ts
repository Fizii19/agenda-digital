'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { inflateRawSync } from 'node:zlib';
import prisma from '@/lib/prisma';

type RuanganPayload = {
  nama: string;
  tipe: string;
  kapasitas?: number | null;
  aktif?: boolean;
};

type ImportResult = {
  success: boolean;
  message: string;
  imported?: number;
  updated?: number;
  skipped?: number;
  errors?: string[];
};

type RuanganImportRow = {
  nama: string;
  tipe: string;
  kapasitas: number | null;
  aktif: boolean;
};

const ruanganPath = '/admin/ruangan';
const tipeRuangan = new Set(['Kelas', 'Lab', 'Bengkel', 'Aula', 'Lainnya']);

function getDb() {
  return (prisma as typeof prisma & { default?: typeof prisma }).default ?? prisma;
}

async function requireAdmin() {
  const cookieStore = await cookies();
  const role = cookieStore.get('userRole')?.value;

  if (role !== 'admin') {
    throw new Error('Akses ditolak.');
  }
}

function cleanValue(value: unknown) {
  return String(value ?? '').trim();
}

function normalizeTipe(value: string) {
  const cleaned = cleanValue(value).toLowerCase();
  const matched = [...tipeRuangan].find((tipe) => tipe.toLowerCase() === cleaned);
  return matched ?? '';
}

function normalizeAktif(value: string) {
  const cleaned = cleanValue(value).toLowerCase();
  if (!cleaned) return true;

  return ['ya', 'y', 'true', '1', 'aktif', 'active'].includes(cleaned);
}

function normalizePayload(data: RuanganPayload) {
  const nama = cleanValue(data.nama).toUpperCase();
  const tipe = normalizeTipe(data.tipe);
  const kapasitas = data.kapasitas ? Number(data.kapasitas) : null;

  if (!nama) return { success: false as const, error: 'Nama ruangan wajib diisi' };
  if (!tipe) return { success: false as const, error: 'Tipe ruangan wajib dipilih: Kelas, Lab, Bengkel, Aula, atau Lainnya' };
  if (kapasitas !== null && (!Number.isFinite(kapasitas) || kapasitas < 1)) {
    return { success: false as const, error: 'Kapasitas harus lebih dari 0' };
  }

  return {
    success: true as const,
    data: {
      nama,
      tipe,
      kapasitas,
      aktif: data.aktif ?? true,
    },
  };
}

export async function getRuanganList() {
  await requireAdmin();
  const db = getDb();

  try {
    const ruangans = await db.ruangan.findMany({
      orderBy: { aktif: 'desc' },
    });

    return ruangans.sort((a, b) => {
      // If one is inactive, keep inactive at the bottom (optional but good for management)
      if (a.aktif !== b.aktif) {
        return a.aktif ? -1 : 1;
      }

      const nameA = a.nama.toLowerCase();
      const nameB = b.nama.toLowerCase();

      const isLabA = nameA.includes('lab');
      const isLabB = nameB.includes('lab');

      // 1. Rule: Lab rooms always last
      if (isLabA !== isLabB) {
        return isLabA ? 1 : -1;
      }

      // 2. Both are labs or both aren't labs:
      // Rule: A-Z then AA, AB... (Sort by length first, then alphabetically)
      if (a.nama.length !== b.nama.length) {
        return a.nama.length - b.nama.length;
      }

      return a.nama.localeCompare(b.nama, undefined, { numeric: true, sensitivity: 'base' });
    });
  } catch (error) {
    console.error('Error fetching ruangan list:', error);
    return [];
  }
}

export async function createRuangan(data: RuanganPayload) {
  await requireAdmin();
  const normalized = normalizePayload(data);
  if (!normalized.success) return { success: false, error: normalized.error };

  try {
    const db = getDb();

    await db.ruangan.create({
      data: {
        id: crypto.randomUUID(),
        ...normalized.data,
        updatedAt: new Date(),
      },
    });

    revalidatePath(ruanganPath);
    return { success: true };
  } catch (error) {
    console.error('Error creating ruangan:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Gagal membuat ruangan' };
  }
}

export async function updateRuangan(id: string, data: RuanganPayload) {
  await requireAdmin();
  const normalized = normalizePayload(data);
  if (!normalized.success) return { success: false, error: normalized.error };

  try {
    const db = getDb();

    await db.ruangan.update({
      where: { id },
      data: {
        ...normalized.data,
        updatedAt: new Date(),
      },
    });

    revalidatePath(ruanganPath);
    return { success: true };
  } catch (error) {
    console.error('Error updating ruangan:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Gagal memperbarui ruangan' };
  }
}

export async function deleteRuangan(id: string) {
  await requireAdmin();

  try {
    const db = getDb();

    await db.ruangan.delete({ where: { id } });
    revalidatePath(ruanganPath);
    return { success: true };
  } catch (error) {
    console.error('Error deleting ruangan:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Gagal menghapus ruangan' };
  }
}

export async function importRuangan(formData: FormData): Promise<ImportResult> {
  await requireAdmin();

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, message: 'Pilih file CSV atau XLSX terlebih dahulu.' };
  }

  const fileName = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());
  const rows = fileName.endsWith('.csv') ? parseCsv(buffer) : parseXlsx(buffer);

  if (rows.length === 0) {
    return { success: false, message: 'Tidak ada data ruangan yang dapat diimport.' };
  }

  let imported = 0;
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];
  const seenNames = new Set<string>();
  const validRows: RuanganImportRow[] = [];

  for (const [index, row] of rows.entries()) {
    const rowNumber = index + 2;
    const normalized = normalizePayload(row);

    if (!normalized.success) {
      skipped += 1;
      errors.push(`Baris ${rowNumber}: ${normalized.error}.`);
      continue;
    }

    if (seenNames.has(normalized.data.nama)) {
      skipped += 1;
      errors.push(`Baris ${rowNumber}: ruangan ${normalized.data.nama} duplikat di file.`);
      continue;
    }

    seenNames.add(normalized.data.nama);
    validRows.push(normalized.data);
  }

  if (validRows.length === 0) {
    return {
      success: false,
      message: `Import selesai: 0 baru, 0 diperbarui, ${skipped} dilewati.`,
      imported,
      updated,
      skipped,
      errors: errors.slice(0, 10),
    };
  }

  const db = getDb();
  const existingRuangan = await db.ruangan.findMany({
    where: { nama: { in: validRows.map((row) => row.nama) } },
    select: { nama: true },
  });
  const existingNames = new Set(existingRuangan.map((item) => item.nama));
  const rowsToCreate = validRows.filter((row) => !existingNames.has(row.nama));
  const rowsToUpdate = validRows.filter((row) => existingNames.has(row.nama));

  if (rowsToCreate.length > 0) {
    try {
      const result = await db.ruangan.createMany({
        data: rowsToCreate.map((row) => ({
          id: crypto.randomUUID(),
          ...row,
          updatedAt: new Date(),
        })),
        skipDuplicates: true,
      });

      imported = result.count;
      skipped += rowsToCreate.length - result.count;
    } catch {
      skipped += rowsToCreate.length;
      errors.push('Gagal menyimpan sebagian data ruangan baru.');
    }
  }

  if (rowsToUpdate.length > 0) {
    const updateResults = await Promise.allSettled(
      rowsToUpdate.map((row) => db.ruangan.update({
        where: { nama: row.nama },
        data: {
          tipe: row.tipe,
          kapasitas: row.kapasitas,
          aktif: row.aktif,
          updatedAt: new Date(),
        },
      }))
    );

    for (const [index, result] of updateResults.entries()) {
      if (result.status === 'fulfilled') {
        updated += 1;
      } else {
        skipped += 1;
        errors.push(`Ruangan ${rowsToUpdate[index].nama}: gagal diperbarui.`);
      }
    }
  }

  revalidatePath(ruanganPath);

  return {
    success: skipped === 0,
    message: `Import selesai: ${imported} baru, ${updated} diperbarui, ${skipped} dilewati.`,
    imported,
    updated,
    skipped,
    errors: errors.slice(0, 10),
  };
}

function parseCsv(buffer: Buffer): RuanganImportRow[] {
  const text = buffer.toString('utf8').replace(/^\uFEFF/, '');
  const rows = splitCsvRows(text);
  const header = rows[0]?.map((cell) => cell.toLowerCase().trim()) ?? [];
  const hasNamedHeader = header.some((cell) => ['nama', 'nama ruangan', 'ruang', 'room', 'tipe', 'jenis', 'kapasitas', 'aktif'].includes(cell));
  const dataRows = hasNamedHeader ? rows.slice(1) : rows;

  return dataRows.map((row) => normalizeRow({
    nama: valueByHeader(row, header, ['nama', 'nama ruangan', 'ruang', 'room']) || row[0],
    tipe: valueByHeader(row, header, ['tipe', 'jenis']) || row[1],
    kapasitas: valueByHeader(row, header, ['kapasitas', 'daya_tampung']) || row[2],
    aktif: valueByHeader(row, header, ['aktif', 'status']) || row[3],
  })).filter(Boolean) as RuanganImportRow[];
}

function splitCsvRows(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(cell);
      cell = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(cell);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  row.push(cell);
  if (row.some((value) => value.trim())) rows.push(row);

  return rows;
}

function valueByHeader(row: string[], header: string[], candidates: string[]) {
  const index = header.findIndex((cell) => candidates.includes(cell));
  return index >= 0 ? row[index] : '';
}

function parseXlsx(buffer: Buffer): RuanganImportRow[] {
  const entries = readZipEntries(buffer);
  const sheet = entries.get('xl/worksheets/sheet1.xml');
  if (!sheet) return [];

  const sharedStrings = parseSharedStrings(entries.get('xl/sharedStrings.xml')?.toString('utf8') ?? '');
  const xml = sheet.toString('utf8');

  return [...xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)]
    .slice(1)
    .map((match) => parseXlsxRow(match[1], sharedStrings))
    .map((row) => normalizeRow({
      nama: row.A,
      tipe: row.B,
      kapasitas: row.C,
      aktif: row.D,
    }))
    .filter(Boolean) as RuanganImportRow[];
}

function readZipEntries(buffer: Buffer) {
  const entries = new Map<string, Buffer>();
  let offset = 0;

  while (offset < buffer.length - 30) {
    if (buffer.readUInt32LE(offset) !== 0x04034b50) {
      offset += 1;
      continue;
    }

    const compression = buffer.readUInt16LE(offset + 8);
    const compressedSize = buffer.readUInt32LE(offset + 18);
    const fileNameLength = buffer.readUInt16LE(offset + 26);
    const extraLength = buffer.readUInt16LE(offset + 28);
    const nameStart = offset + 30;
    const dataStart = nameStart + fileNameLength + extraLength;
    const name = buffer.subarray(nameStart, nameStart + fileNameLength).toString('utf8');
    const data = buffer.subarray(dataStart, dataStart + compressedSize);

    if (compression === 0) {
      entries.set(name, data);
    } else if (compression === 8) {
      entries.set(name, inflateRawSync(data));
    }

    offset = dataStart + compressedSize;
  }

  return entries;
}

function parseSharedStrings(xml: string) {
  return [...xml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((match) => {
    return [...match[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)]
      .map((textMatch) => decodeXml(textMatch[1]))
      .join('');
  });
}

function parseXlsxRow(xml: string, sharedStrings: string[]) {
  const row: Record<string, string> = {};

  for (const match of xml.matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
    const attributes = match[1];
    const body = match[2];
    const cellRef = attributes.match(/\br="([A-Z]+)\d+"/)?.[1];
    if (!cellRef) continue;

    const value = body.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? '';
    const inlineValue = body.match(/<t[^>]*>([\s\S]*?)<\/t>/)?.[1] ?? '';
    const parsedValue = attributes.includes('t="s"') ? sharedStrings[Number(value)] : inlineValue || value;

    row[cellRef] = decodeXml(parsedValue);
  }

  return row;
}

function normalizeRow(row: Record<string, string | undefined>): RuanganImportRow | null {
  const nama = cleanValue(row.nama).toUpperCase();
  const tipe = normalizeTipe(cleanValue(row.tipe));
  const kapasitasValue = cleanValue(row.kapasitas);
  const kapasitas = kapasitasValue ? Number(kapasitasValue) : null;
  const aktif = normalizeAktif(cleanValue(row.aktif));

  if (!nama && !tipe) return null;

  return { nama, tipe, kapasitas, aktif };
}

function decodeXml(value: string) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}
