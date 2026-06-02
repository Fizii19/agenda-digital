'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { inflateRawSync } from 'node:zlib';
import { normalizeKelasName } from '@/lib/kelas-normalization';

type ImportResult = {
  success: boolean;
  message: string;
  imported?: number;
  updated?: number;
  skipped?: number;
  errors?: string[];
};

type MapelImportRow = {
  nama: string;
  kode: string | null;
  guruNip: string;
  kelas: string;
  jam: number;
};

const mapelPath = '/admin/mapel';

function getDb() {
  return (prisma as typeof prisma & { default?: typeof prisma }).default ?? prisma;
}

function cleanValue(value: unknown) {
  return String(value ?? '').trim();
}

export async function getMapelList() {
  const db = getDb();

  try {
    return await db.subject.findMany({
      include: {
        guru: {
          select: { name: true }
        },
        kelas: {
          select: { nama: true }
        }
      },
      orderBy: { nama: 'asc' },
    });
  } catch (error) {
    console.error('Error fetching mapel list:', error);
    return [];
  }
}

export async function createMapel(data: {
  nama: string;
  kode?: string;
  guruId: string;
  kelasId: string;
  jam: number;
}) {
  const db = getDb();

  try {
    await db.subject.create({
      data: {
        id: crypto.randomUUID(),
        nama: data.nama,
        kode: data.kode,
        guruId: data.guruId,
        kelasId: data.kelasId,
        jam: Number(data.jam),
      },
    });
    revalidatePath(mapelPath);
    return { success: true };
  } catch (error) {
    console.error('Error creating mapel:', error);
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
        return { success: false, error: 'Mata pelajaran ini sudah ada di kelas tersebut.' };
    }
    return { success: false, error: error instanceof Error ? error.message : 'Gagal membuat mata pelajaran' };
  }
}

export async function updateMapel(id: string, data: {
  nama: string;
  kode?: string;
  guruId: string;
  kelasId: string;
  jam: number;
}) {
  const db = getDb();

  try {
    await db.subject.update({
      where: { id },
      data: {
        nama: data.nama,
        kode: data.kode,
        guruId: data.guruId,
        kelasId: data.kelasId,
        jam: Number(data.jam),
      },
    });
    revalidatePath(mapelPath);
    return { success: true };
  } catch (error) {
    console.error('Error updating mapel:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Gagal memperbarui mata pelajaran' };
  }
}

export async function deleteMapel(id: string) {
  const db = getDb();

  try {
    await db.subject.delete({
      where: { id },
    });
    revalidatePath(mapelPath);
    return { success: true };
  } catch (error) {
    console.error('Error deleting mapel:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Gagal menghapus mata pelajaran' };
  }
}

export async function getGuruList() {
    const db = getDb();

    try {
        return await db.user.findMany({
            where: { role: 'guru' },
            select: { id: true, name: true, nip: true },
            orderBy: { name: 'asc' }
        });
    } catch (error) {
        console.error('Error fetching guru list:', error);
        return [];
    }
}

export async function importMapel(formData: FormData): Promise<ImportResult> {
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, message: 'Pilih file CSV atau XLSX terlebih dahulu.' };
  }

  const fileName = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());
  const rows = fileName.endsWith('.csv') ? parseCsv(buffer) : parseXlsx(buffer);

  if (rows.length === 0) {
    return { success: false, message: 'Tidak ada data mata pelajaran yang dapat diimport.' };
  }

  let imported = 0;
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];
  const validRows: MapelImportRow[] = [];
  const seen = new Set<string>();

  for (const [index, row] of rows.entries()) {
    const rowNumber = index + 2;

    if (!row.nama || !row.guruNip || !row.kelas) {
      skipped += 1;
      errors.push(`Baris ${rowNumber}: nama, guru_nip, dan kelas wajib diisi.`);
      continue;
    }

    if (!Number.isFinite(row.jam) || row.jam < 1) {
      skipped += 1;
      errors.push(`Baris ${rowNumber}: jam harus angka lebih dari 0.`);
      continue;
    }

    const key = `${row.nama.toLowerCase()}::${row.kelas}`;
    if (seen.has(key)) {
      skipped += 1;
      errors.push(`Baris ${rowNumber}: ${row.nama} di ${row.kelas} duplikat di file.`);
      continue;
    }

    seen.add(key);
    validRows.push(row);
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
  const guruList = await db.user.findMany({
    where: { nip: { in: validRows.map((row) => row.guruNip) }, role: 'guru' },
    select: { id: true, nip: true },
  });
  const kelasList = await db.kelas.findMany({
    where: { nama: { in: validRows.map((row) => row.kelas) } },
    select: { id: true, nama: true },
  });
  const guruByNip = new Map(guruList.filter((guru) => guru.nip).map((guru) => [guru.nip as string, guru]));
  const kelasByNama = new Map(kelasList.map((kelas) => [kelas.nama, kelas]));
  const rowsToSave: Array<MapelImportRow & { guruId: string; kelasId: string }> = [];

  for (const row of validRows) {
    const guru = guruByNip.get(row.guruNip);
    const kelas = kelasByNama.get(row.kelas);

    if (!guru) {
      skipped += 1;
      errors.push(`${row.nama}: guru dengan NIP ${row.guruNip} tidak ditemukan.`);
      continue;
    }

    if (!kelas) {
      skipped += 1;
      errors.push(`${row.nama}: kelas ${row.kelas} tidak ditemukan.`);
      continue;
    }

    rowsToSave.push({ ...row, guruId: guru.id, kelasId: kelas.id });
  }

  if (rowsToSave.length === 0) {
    return {
      success: false,
      message: `Import selesai: 0 baru, 0 diperbarui, ${skipped} dilewati.`,
      imported,
      updated,
      skipped,
      errors: errors.slice(0, 10),
    };
  }

  const existingSubjects = await db.subject.findMany({
    where: {
      OR: rowsToSave.map((row) => ({
        nama: row.nama,
        kelasId: row.kelasId,
      })),
    },
    select: { id: true, nama: true, kelasId: true },
  });
  const existingByKey = new Map(existingSubjects.map((subject) => [`${subject.nama.toLowerCase()}::${subject.kelasId}`, subject]));

  const saveResults = await Promise.allSettled(rowsToSave.map((row) => {
    const existing = existingByKey.get(`${row.nama.toLowerCase()}::${row.kelasId}`);
    const data = {
      nama: row.nama,
      kode: row.kode,
      guruId: row.guruId,
      kelasId: row.kelasId,
      jam: row.jam,
    };

    if (existing) {
      return db.subject.update({ where: { id: existing.id }, data }).then(() => 'updated' as const);
    }

    return db.subject.create({
      data: {
        id: crypto.randomUUID(),
        ...data,
      },
    }).then(() => 'imported' as const);
  }));

  for (const [index, result] of saveResults.entries()) {
    if (result.status === 'fulfilled') {
      if (result.value === 'imported') imported += 1;
      if (result.value === 'updated') updated += 1;
    } else {
      skipped += 1;
      errors.push(`${rowsToSave[index].nama}: gagal disimpan.`);
    }
  }

  revalidatePath(mapelPath);

  return {
    success: skipped === 0,
    message: `Import selesai: ${imported} baru, ${updated} diperbarui, ${skipped} dilewati.`,
    imported,
    updated,
    skipped,
    errors: errors.slice(0, 10),
  };
}

function parseCsv(buffer: Buffer): MapelImportRow[] {
  const text = buffer.toString('utf8').replace(/^\uFEFF/, '');
  const rows = splitCsvRows(text);
  const header = rows[0]?.map((cell) => cell.toLowerCase().trim()) ?? [];
  const hasNamedHeader = header.some((cell) => ['nama', 'kode', 'guru_nip', 'nip', 'kelas', 'jam'].includes(cell));
  const dataRows = hasNamedHeader ? rows.slice(1) : rows;

  return dataRows.map((row) => normalizeRow({
    nama: valueByHeader(row, header, ['nama', 'mata_pelajaran', 'mapel']) || row[0],
    kode: valueByHeader(row, header, ['kode']) || row[1],
    guruNip: valueByHeader(row, header, ['guru_nip', 'nip']) || row[2],
    kelas: valueByHeader(row, header, ['kelas']) || row[3],
    jam: valueByHeader(row, header, ['jam', 'jpm']) || row[4],
  })).filter(Boolean) as MapelImportRow[];
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

function parseXlsx(buffer: Buffer): MapelImportRow[] {
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
      kode: row.B,
      guruNip: row.C,
      kelas: row.D,
      jam: row.E,
    }))
    .filter(Boolean) as MapelImportRow[];
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

function normalizeRow(row: Record<string, string | undefined>): MapelImportRow | null {
  const nama = cleanValue(row.nama);
  const kode = cleanValue(row.kode) || null;
  const guruNip = cleanValue(row.guruNip);
  const kelas = normalizeKelasName(cleanValue(row.kelas)) ?? '';
  const jamValue = cleanValue(row.jam);
  const jam = jamValue ? Number(jamValue) : 2;

  if (!nama && !guruNip && !kelas) return null;

  return { nama, kode, guruNip, kelas, jam };
}

function decodeXml(value: string) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}
