'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { inflateRawSync } from 'node:zlib';
import prisma from '@/lib/prisma';
import { normalizeKelasName, parseKelasName } from '@/lib/kelas-normalization';

function getDb() {
  return (prisma as typeof prisma & { default?: typeof prisma }).default ?? prisma;
}

type ActionResult = {
  success: boolean;
  message: string;
  imported?: number;
  updated?: number;
  skipped?: number;
  errors?: string[];
};

type SiswaImportRow = {
  name: string;
  nis: string;
  email: string | null;
  kelas: string | null;
};

const siswaPath = '/admin/siswa';

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

function normalizeEmail(value: string) {
  const email = cleanValue(value).toLowerCase();
  return email.includes('@') ? email : null;
}

function getRequired(formData: FormData, key: string) {
  return cleanValue(formData.get(key));
}

async function getActiveTahunAjaran() {
  const db = getDb();

  const existing = await db.tahunajaran.findFirst({
    orderBy: [{ aktif: 'desc' }, { nama: 'desc' }],
  });

  if (existing) return existing;

  const now = new Date();
  const startYear = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  const nama = `${startYear}/${startYear + 1}`;

  return db.tahunajaran.create({
    data: {
      id: crypto.randomUUID(),
      nama,
      aktif: true,
      updatedAt: new Date(),
    },
  });
}

async function ensureImportedKelas(rows: SiswaImportRow[]) {
  const db = getDb();

  const parsedKelas = rows
    .map((row) => row.kelas ? parseKelasName(row.kelas) : null)
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  if (parsedKelas.length === 0) return;

  const uniqueKelas = [...new Map(parsedKelas.map((item) => [item.nama, item])).values()];
  const existingKelas = await db.kelas.findMany({
    where: { nama: { in: uniqueKelas.map((item) => item.nama) } },
    select: { nama: true },
  });
  const existingNames = new Set(existingKelas.map((item) => item.nama));
  const kelasToCreate = uniqueKelas.filter((item) => !existingNames.has(item.nama));

  if (kelasToCreate.length === 0) return;

  const tahunAjaran = await getActiveTahunAjaran();

  await db.kelas.createMany({
    data: kelasToCreate.map((item) => ({
      id: crypto.randomUUID(),
      nama: item.nama,
      tingkat: item.tingkat,
      jurusan: item.jurusan,
      waliKelas: '-',
      jumlahSiswa: 0,
      tahunAjaran: tahunAjaran.nama,
      tahunAjaranId: tahunAjaran.id,
      updatedAt: new Date(),
    })),
    skipDuplicates: true,
  });
}

async function syncJumlahSiswa(kelasNames: string[]) {
  const db = getDb();

  const uniqueNames = [...new Set(kelasNames.filter(Boolean))];

  await Promise.all(uniqueNames.map(async (kelasNama) => {
    const count = await db.user.count({
      where: { role: 'siswa', kelas: kelasNama },
    });

    await db.kelas.updateMany({
      where: { nama: kelasNama },
      data: { jumlahSiswa: count, updatedAt: new Date() },
    });
  }));
}

export async function createSiswa(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const db = getDb();

  const name = getRequired(formData, 'name');
  const nis = getRequired(formData, 'nis');
  const email = normalizeEmail(getRequired(formData, 'email'));
  const kelas = normalizeKelasName(getRequired(formData, 'kelas')) || null;

  if (!name || !nis) {
    return { success: false, message: 'Nama dan NIS wajib diisi.' };
  }

  try {
    await db.user.create({
      data: {
        id: crypto.randomUUID(),
        name,
        nis,
        email,
        kelas,
        role: 'siswa',
        updatedAt: new Date(),
      },
    });

    if (kelas) await syncJumlahSiswa([kelas]);

    revalidatePath(siswaPath);
    return { success: true, message: 'Siswa berhasil ditambahkan.' };
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return { success: false, message: 'NIS atau email sudah digunakan.' };
    }

    return { success: false, message: 'Gagal menambahkan siswa.' };
  }
}

export async function updateSiswa(id: string, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const db = getDb();

  const name = getRequired(formData, 'name');
  const nis = getRequired(formData, 'nis');
  const email = normalizeEmail(getRequired(formData, 'email'));
  const kelas = normalizeKelasName(getRequired(formData, 'kelas')) || null;

  if (!name || !nis) {
    return { success: false, message: 'Nama dan NIS wajib diisi.' };
  }

  try {
    const existing = await db.user.findUnique({ where: { id }, select: { kelas: true } });

    await db.user.update({
      where: { id },
      data: {
        name,
        nis,
        email,
        kelas,
        updatedAt: new Date(),
      },
    });

    await syncJumlahSiswa([existing?.kelas ?? '', kelas ?? '']);

    revalidatePath(siswaPath);
    return { success: true, message: 'Data siswa berhasil diperbarui.' };
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return { success: false, message: 'NIS atau email sudah digunakan oleh data lain.' };
    }

    return { success: false, message: 'Gagal memperbarui data siswa.' };
  }
}

export async function deleteSiswa(id: string): Promise<ActionResult> {
  await requireAdmin();
  const db = getDb();

  try {
    const existing = await db.user.findUnique({ where: { id }, select: { kelas: true } });

    await db.user.delete({
      where: { id },
    });

    if (existing?.kelas) await syncJumlahSiswa([existing.kelas]);

    revalidatePath(siswaPath);
    return { success: true, message: 'Siswa berhasil dihapus.' };
  } catch {
    return { success: false, message: 'Gagal menghapus siswa.' };
  }
}

export async function importSiswa(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const db = getDb();

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, message: 'Pilih file CSV atau XLSX terlebih dahulu.' };
  }

  const fileName = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());
  const rows = fileName.endsWith('.csv') ? parseCsv(buffer) : parseXlsx(buffer);

  if (rows.length === 0) {
    return { success: false, message: 'Tidak ada data siswa yang dapat diimport.' };
  }

  let imported = 0;
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];
  const seenNis = new Set<string>();
  const validRows: SiswaImportRow[] = [];

  for (const [index, row] of rows.entries()) {
    const rowNumber = index + 2;

    if (!row.name || !row.nis) {
      skipped += 1;
      errors.push(`Baris ${rowNumber}: nama atau NIS kosong.`);
      continue;
    }

    if (seenNis.has(row.nis)) {
      skipped += 1;
      errors.push(`Baris ${rowNumber}: NIS ${row.nis} duplikat di file.`);
      continue;
    }

    seenNis.add(row.nis);
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

  await ensureImportedKelas(validRows);

  const emails = validRows.map((row) => row.email).filter((email): email is string => Boolean(email));
  const lookupConditions = [
    { nis: { in: validRows.map((row) => row.nis) } },
    ...(emails.length > 0 ? [{ email: { in: emails } }] : []),
  ];
  const existingUsers = await db.user.findMany({
    where: {
      OR: lookupConditions,
    },
    select: { id: true, nis: true, email: true, kelas: true },
  });
  const existingByNis = new Map(existingUsers.filter((user) => user.nis).map((user) => [user.nis as string, user]));
  const existingByEmail = new Map(existingUsers.filter((user) => user.email).map((user) => [user.email as string, user]));
  const rowsToCreate: SiswaImportRow[] = [];
  const rowsToUpdate: SiswaImportRow[] = [];

  for (const row of validRows) {
    const existingByRowNis = existingByNis.get(row.nis);
    const existingByRowEmail = row.email ? existingByEmail.get(row.email) : null;

    if (existingByRowEmail && existingByRowEmail.nis !== row.nis) {
      skipped += 1;
      errors.push(`NIS ${row.nis}: email ${row.email} sudah digunakan data lain.`);
      continue;
    }

    if (existingByRowNis) {
      rowsToUpdate.push(row);
    } else {
      rowsToCreate.push(row);
    }
  }

  if (rowsToCreate.length > 0) {
    try {
      const result = await db.user.createMany({
        data: rowsToCreate.map((row) => ({
          id: crypto.randomUUID(),
          name: row.name,
          nis: row.nis,
          email: row.email,
          kelas: row.kelas,
          role: 'siswa',
          updatedAt: new Date(),
        })),
        skipDuplicates: true,
      });

      imported = result.count;
      skipped += rowsToCreate.length - result.count;
    } catch {
      skipped += rowsToCreate.length;
      errors.push('Gagal menyimpan sebagian data baru.');
    }
  }

  if (rowsToUpdate.length > 0) {
    const updateResults = await Promise.allSettled(
      rowsToUpdate.map((row) => db.user.update({
        where: { nis: row.nis },
        data: {
          name: row.name,
          email: row.email,
          kelas: row.kelas,
          role: 'siswa',
          updatedAt: new Date(),
        },
      }))
    );

    for (const [index, result] of updateResults.entries()) {
      if (result.status === 'fulfilled') {
        updated += 1;
      } else {
        skipped += 1;
        errors.push(`NIS ${rowsToUpdate[index].nis}: gagal diperbarui.`);
      }
    }
  }

  await syncJumlahSiswa([
    ...validRows.map((row) => row.kelas ?? ''),
    ...existingUsers.map((user) => user.kelas ?? ''),
  ]);

  revalidatePath(siswaPath);

  return {
    success: skipped === 0,
    message: `Import selesai: ${imported} baru, ${updated} diperbarui, ${skipped} dilewati.`,
    imported,
    updated,
    skipped,
    errors: errors.slice(0, 10),
  };
}

function parseCsv(buffer: Buffer): SiswaImportRow[] {
  const text = buffer.toString('utf8').replace(/^\uFEFF/, '');
  const rows = splitCsvRows(text);
  const header = rows[0]?.map((cell) => cell.toLowerCase().trim()) ?? [];
  const hasNamedHeader = header.some((cell) => ['nama', 'name', 'nis', 'kelas', 'email'].includes(cell));
  const dataRows = hasNamedHeader ? rows.slice(1) : rows;

  return dataRows.map((row) => normalizeRow({
    name: valueByHeader(row, header, ['nama', 'name']) || row[1],
    nis: valueByHeader(row, header, ['nis', 'nisn']) || row[2],
    email: valueByHeader(row, header, ['email', 'e-mail']) || row[13],
    kelas: valueByHeader(row, header, ['kelas', 'rombel']) || row[14],
  })).filter(Boolean) as SiswaImportRow[];
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

function parseXlsx(buffer: Buffer): SiswaImportRow[] {
  const entries = readZipEntries(buffer);
  const sheet = entries.get('xl/worksheets/sheet1.xml');
  if (!sheet) return [];

  const sharedStrings = parseSharedStrings(entries.get('xl/sharedStrings.xml')?.toString('utf8') ?? '');
  const xml = sheet.toString('utf8');

  return [...xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)]
    .slice(1)
    .map((match) => parseXlsxRow(match[1], sharedStrings))
    .map((row) => normalizeRow({
      name: row.B,
      nis: row.C,
      email: row.N,
      kelas: row.O,
    }))
    .filter(Boolean) as SiswaImportRow[];
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

function normalizeRow(row: Record<string, string | undefined>): SiswaImportRow | null {
  const name = cleanValue(row.name);
  const nis = cleanValue(row.nis);
  const kelas = normalizeKelasName(cleanValue(row.kelas));
  const email = normalizeEmail(cleanValue(row.email));

  if (!name && !nis) return null;

  return { name, nis, email, kelas };
}

function decodeXml(value: string) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}
