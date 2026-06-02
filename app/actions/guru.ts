'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { inflateRawSync } from 'node:zlib';
import prisma from '@/lib/prisma';

type ActionResult = {
  success: boolean;
  message: string;
  imported?: number;
  updated?: number;
  skipped?: number;
  errors?: string[];
};

type GuruImportRow = {
  name: string;
  nip: string;
  email: string | null;
};

const guruPath = '/admin/guru';

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

export async function createGuru(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const name = getRequired(formData, 'name');
  const nip = getRequired(formData, 'nip');
  const email = normalizeEmail(getRequired(formData, 'email'));

  if (!name || !nip) {
    return { success: false, message: 'Nama dan NIP wajib diisi.' };
  }

  try {
    await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        name,
        nip,
        email,
        role: 'guru',
        updatedAt: new Date(),
      },
    });

    revalidatePath(guruPath);
    return { success: true, message: 'Guru berhasil ditambahkan.' };
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return { success: false, message: 'NIP atau email sudah digunakan.' };
    }

    return { success: false, message: 'Gagal menambahkan guru.' };
  }
}

export async function updateGuru(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const id = getRequired(formData, 'id');
  const name = getRequired(formData, 'name');
  const nip = getRequired(formData, 'nip');
  const email = normalizeEmail(getRequired(formData, 'email'));

  if (!id || !name || !nip) {
    return { success: false, message: 'Nama dan NIP wajib diisi.' };
  }

  try {
    await prisma.user.update({
      where: { id },
      data: {
        name,
        nip,
        email,
        role: 'guru',
        updatedAt: new Date(),
      },
    });

    revalidatePath(guruPath);
    return { success: true, message: 'Data guru berhasil diperbarui.' };
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return { success: false, message: 'NIP atau email sudah digunakan.' };
    }

    return { success: false, message: 'Gagal memperbarui guru.' };
  }
}

export async function deleteGuru(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const id = getRequired(formData, 'id');
  if (!id) {
    return { success: false, message: 'Data guru tidak valid.' };
  }

  try {
    await prisma.user.delete({ where: { id } });
    revalidatePath(guruPath);
    return { success: true, message: 'Guru berhasil dihapus.' };
  } catch {
    return { success: false, message: 'Gagal menghapus guru.' };
  }
}

export async function importGuru(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, message: 'Pilih file CSV atau XLSX terlebih dahulu.' };
  }

  const fileName = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());
  const rows = fileName.endsWith('.csv') ? parseCsv(buffer) : parseXlsx(buffer);

  if (rows.length === 0) {
    return { success: false, message: 'Tidak ada data guru yang dapat diimport.' };
  }

  let imported = 0;
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];
  const seenNip = new Set<string>();
  const validRows: GuruImportRow[] = [];

  for (const [index, row] of rows.entries()) {
    const rowNumber = index + 2;

    if (!row.name || !row.nip) {
      skipped += 1;
      errors.push(`Baris ${rowNumber}: nama atau NIP kosong.`);
      continue;
    }

    if (seenNip.has(row.nip)) {
      skipped += 1;
      errors.push(`Baris ${rowNumber}: NIP ${row.nip} duplikat di file.`);
      continue;
    }

    seenNip.add(row.nip);
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

  const emails = validRows.map((row) => row.email).filter((email): email is string => Boolean(email));
  const existingUsers = await prisma.user.findMany({
    where: {
      OR: [
        { nip: { in: validRows.map((row) => row.nip) } },
        ...(emails.length > 0 ? [{ email: { in: emails } }] : []),
      ],
    },
    select: { id: true, nip: true, email: true },
  });
  const existingByNip = new Map(existingUsers.filter((user) => user.nip).map((user) => [user.nip as string, user]));
  const existingByEmail = new Map(existingUsers.filter((user) => user.email).map((user) => [user.email as string, user]));
  const rowsToCreate: GuruImportRow[] = [];
  const rowsToUpdate: GuruImportRow[] = [];

  for (const row of validRows) {
    const existingByRowNip = existingByNip.get(row.nip);
    const existingByRowEmail = row.email ? existingByEmail.get(row.email) : null;

    if (existingByRowEmail && existingByRowEmail.nip !== row.nip) {
      skipped += 1;
      errors.push(`NIP ${row.nip}: email ${row.email} sudah digunakan data lain.`);
      continue;
    }

    if (existingByRowNip) {
      rowsToUpdate.push(row);
    } else {
      rowsToCreate.push(row);
    }
  }

  if (rowsToCreate.length > 0) {
    try {
      const result = await prisma.user.createMany({
        data: rowsToCreate.map((row) => ({
          id: crypto.randomUUID(),
          name: row.name,
          nip: row.nip,
          email: row.email,
          role: 'guru',
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
      rowsToUpdate.map((row) => prisma.user.update({
        where: { nip: row.nip },
        data: {
          name: row.name,
          email: row.email,
          role: 'guru',
          updatedAt: new Date(),
        },
      }))
    );

    for (const [index, result] of updateResults.entries()) {
      if (result.status === 'fulfilled') {
        updated += 1;
      } else {
        skipped += 1;
        errors.push(`NIP ${rowsToUpdate[index].nip}: gagal diperbarui.`);
      }
    }
  }

  revalidatePath(guruPath);

  return {
    success: skipped === 0,
    message: `Import selesai: ${imported} baru, ${updated} diperbarui, ${skipped} dilewati.`,
    imported,
    updated,
    skipped,
    errors: errors.slice(0, 10),
  };
}

function parseCsv(buffer: Buffer): GuruImportRow[] {
  const text = buffer.toString('utf8').replace(/^\uFEFF/, '');
  const rows = splitCsvRows(text);
  const header = rows[0]?.map((cell) => cell.toLowerCase().trim()) ?? [];
  const hasNamedHeader = header.some((cell) => ['nama', 'name', 'nip', 'email'].includes(cell));
  const dataRows = hasNamedHeader ? rows.slice(1) : rows;

  return dataRows.map((row) => normalizeRow({
    name: valueByHeader(row, header, ['nama', 'name']) || row[0],
    nip: valueByHeader(row, header, ['nip']) || row[1],
    email: valueByHeader(row, header, ['email', 'e-mail']) || row[2],
  })).filter(Boolean) as GuruImportRow[];
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

function parseXlsx(buffer: Buffer): GuruImportRow[] {
  const entries = readZipEntries(buffer);
  const sheet = entries.get('xl/worksheets/sheet1.xml');
  if (!sheet) return [];

  const sharedStrings = parseSharedStrings(entries.get('xl/sharedStrings.xml')?.toString('utf8') ?? '');
  const xml = sheet.toString('utf8');

  return [...xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)]
    .slice(1)
    .map((match) => parseXlsxRow(match[1], sharedStrings))
    .map((row) => normalizeRow({
      name: row.A,
      nip: row.B,
      email: row.C,
    }))
    .filter(Boolean) as GuruImportRow[];
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

function normalizeRow(row: Record<string, string | undefined>): GuruImportRow | null {
  const name = cleanValue(row.name);
  const nip = cleanValue(row.nip);
  const email = normalizeEmail(cleanValue(row.email));

  if (!name && !nip) return null;

  return { name, nip, email };
}

function decodeXml(value: string) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}
