'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { jurusanOptions, normalizeJurusan, tingkatOptions } from '@/lib/kelas-normalization';

function getDb() {
  return (prisma as typeof prisma & { default?: typeof prisma }).default ?? prisma;
}

type KelasPayload = {
  nama: string;
  tingkat: number;
  jurusan: string;
  waliKelas: string;
  tahunAjaran: string;
  tahunAjaranId?: string | null;
};

function createId() {
  return crypto.randomUUID();
}

async function resolveTahunAjaran(data: Pick<KelasPayload, 'tahunAjaran' | 'tahunAjaranId'>) {
  const db = getDb();

  if (data.tahunAjaranId) {
    const selected = await db.tahunajaran.findUnique({ where: { id: data.tahunAjaranId } });
    if (selected) return selected;
  }

  const nama = data.tahunAjaran.trim();
  if (!nama) return null;

  return db.tahunajaran.upsert({
    where: { nama },
    create: {
      id: createId(),
      nama,
      updatedAt: new Date(),
    },
    update: {
      updatedAt: new Date(),
    },
  });
}

function normalizeKelasPayload(data: KelasPayload) {
  const tingkat = Number(data.tingkat);
  const jurusan = normalizeJurusan(data.jurusan);

  if (!tingkatOptions.includes(tingkat as (typeof tingkatOptions)[number])) {
    return { success: false as const, error: 'Tingkat harus 10, 11, atau 12' };
  }

  if (!jurusanOptions.includes(jurusan as (typeof jurusanOptions)[number])) {
    return { success: false as const, error: 'Jurusan tidak valid' };
  }

  return {
    success: true as const,
    data: {
      ...data,
      tingkat,
      jurusan,
    },
  };
}

export async function getKelasList() {
  const db = getDb();

  try {
    return await db.kelas.findMany({
      orderBy: { nama: 'asc' },
      include: { tahunajaran: true },
    });
  } catch (error) {
    console.error('Error fetching kelas list:', error);
    return [];
  }
}

export async function getTahunAjaranList() {
  const db = getDb();

  try {
    const existing = await db.tahunajaran.findMany({
      orderBy: [{ aktif: 'desc' }, { nama: 'desc' }],
    });

    if (existing.length > 0) return existing;

    const now = new Date();
    const startYear = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
    const defaultTahunAjaran = `${startYear}/${startYear + 1}`;

    const created = await db.tahunajaran.create({
      data: {
        id: createId(),
        nama: defaultTahunAjaran,
        aktif: true,
        updatedAt: new Date(),
      },
    });

    return [created];
  } catch (error) {
    console.error('Error fetching tahun ajaran list:', error);
    return [];
  }
}

export async function getGuruOptions() {
  const db = getDb();

  try {
    return await db.user.findMany({
      where: { role: 'guru' },
      select: {
        id: true,
        name: true,
        nip: true,
      },
      orderBy: { name: 'asc' },
    });
  } catch (error) {
    console.error('Error fetching guru options:', error);
    return [];
  }
}

async function assertWaliKelasAvailable(data: KelasPayload, kelasId?: string) {
  const db = getDb();
  const waliKelas = data.waliKelas.trim();

  if (!waliKelas) {
    return { success: false as const, error: 'Wali kelas wajib dipilih' };
  }

  const usedByOtherKelas = await db.kelas.findFirst({
    where: {
      waliKelas,
      ...(kelasId ? { id: { not: kelasId } } : {}),
    },
    select: { id: true, nama: true },
  });

  if (usedByOtherKelas) {
    return {
      success: false as const,
      error: `Guru tersebut sudah menjadi wali kelas di ${usedByOtherKelas.nama}`,
    };
  }

  return { success: true as const };
}

export async function createTahunAjaran(nama: string) {
  const cleanedNama = nama.trim();

  if (!/^\d{4}\/\d{4}$/.test(cleanedNama)) {
    return { success: false, error: 'Format tahun ajaran harus seperti 2026/2027' };
  }

  const [startYear, endYear] = cleanedNama.split('/').map(Number);
  if (endYear !== startYear + 1) {
    return { success: false, error: 'Tahun akhir harus satu tahun setelah tahun awal' };
  }

  try {
    const db = getDb();
    const existingCount = await db.tahunajaran.count();

    await db.tahunajaran.create({
      data: {
        id: createId(),
        nama: cleanedNama,
        aktif: existingCount === 0,
        updatedAt: new Date(),
      },
    });

    revalidatePath('/admin/kelas');
    return { success: true };
  } catch (error) {
    console.error('Error creating tahun ajaran:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Gagal membuat tahun ajaran' };
  }
}

export async function setTahunAjaranAktif(id: string) {
  try {
    const db = getDb();
    await db.$transaction([
      db.tahunajaran.updateMany({
        data: {
          aktif: false,
          updatedAt: new Date(),
        },
      }),
      db.tahunajaran.update({
        where: { id },
        data: {
          aktif: true,
          updatedAt: new Date(),
        },
      }),
    ]);

    revalidatePath('/admin/kelas');
    return { success: true };
  } catch (error) {
    console.error('Error setting active tahun ajaran:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Gagal mengaktifkan tahun ajaran' };
  }
}

export async function deleteTahunAjaran(id: string) {
  try {
    const db = getDb();
    const usedCount = await db.kelas.count({ where: { tahunAjaranId: id } });
    if (usedCount > 0) {
      return { success: false, error: 'Tahun ajaran masih dipakai kelas dan tidak bisa dihapus' };
    }

    const target = await db.tahunajaran.findUnique({ where: { id } });
    if (!target) return { success: false, error: 'Tahun ajaran tidak ditemukan' };
    if (target.aktif) return { success: false, error: 'Tahun ajaran aktif tidak bisa dihapus' };

    await db.tahunajaran.delete({ where: { id } });
    revalidatePath('/admin/kelas');
    return { success: true };
  } catch (error) {
    console.error('Error deleting tahun ajaran:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Gagal menghapus tahun ajaran' };
  }
}

export async function createKelas(data: KelasPayload) {
  try {
    const db = getDb();
    const normalized = normalizeKelasPayload(data);
    if (!normalized.success) return { success: false, error: normalized.error };

    const tahunAjaran = await resolveTahunAjaran(normalized.data);
    if (!tahunAjaran) return { success: false, error: 'Tahun ajaran wajib dipilih' };

    const waliValidation = await assertWaliKelasAvailable(normalized.data);
    if (!waliValidation.success) return { success: false, error: waliValidation.error };

    await db.kelas.create({
      data: {
        id: createId(),
        nama: normalized.data.nama,
        tingkat: normalized.data.tingkat,
        jurusan: normalized.data.jurusan,
        waliKelas: normalized.data.waliKelas,
        tahunAjaran: tahunAjaran.nama,
        tahunAjaranId: tahunAjaran.id,
        jumlahSiswa: 0,
        updatedAt: new Date(),
      },
    });
    revalidatePath('/admin/kelas');
    return { success: true };
  } catch (error) {
    console.error('Error creating kelas:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Gagal membuat kelas' };
  }
}

export async function updateKelas(id: string, data: KelasPayload) {
  try {
    const db = getDb();
    const normalized = normalizeKelasPayload(data);
    if (!normalized.success) return { success: false, error: normalized.error };

    const tahunAjaran = await resolveTahunAjaran(normalized.data);
    if (!tahunAjaran) return { success: false, error: 'Tahun ajaran wajib dipilih' };

    const waliValidation = await assertWaliKelasAvailable(normalized.data, id);
    if (!waliValidation.success) return { success: false, error: waliValidation.error };

    await db.kelas.update({
      where: { id },
      data: {
        nama: normalized.data.nama,
        tingkat: normalized.data.tingkat,
        jurusan: normalized.data.jurusan,
        waliKelas: normalized.data.waliKelas,
        tahunAjaran: tahunAjaran.nama,
        tahunAjaranId: tahunAjaran.id,
        updatedAt: new Date(),
      },
    });
    revalidatePath('/admin/kelas');
    return { success: true };
  } catch (error) {
    console.error('Error updating kelas:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Gagal memperbarui kelas' };
  }
}

export async function deleteKelas(id: string) {
  try {
    const db = getDb();
    const kelas = await db.kelas.findUnique({ where: { id } });
    if (!kelas) return { success: false, error: 'Kelas tidak ditemukan' };

    // Set students in this class to null class
    await db.user.updateMany({
      where: { kelas: kelas.nama, role: 'siswa' },
      data: { kelas: null }
    });

    await db.kelas.delete({ where: { id } });
    revalidatePath('/admin/kelas');
    return { success: true };
  } catch (error) {
    console.error('Error deleting kelas:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Gagal menghapus kelas' };
  }
}

export async function getStudentsInKelas(kelasNama: string) {
  try {
    const db = getDb();
    return await db.user.findMany({
      where: { kelas: kelasNama, role: 'siswa' },
      orderBy: { name: 'asc' },
    });
  } catch (error) {
    console.error('Error fetching students in kelas:', error);
    return [];
  }
}

export async function getAvailableStudents() {
  try {
    const db = getDb();
    return await db.user.findMany({
      where: { 
        role: 'siswa', 
        OR: [
          { kelas: null },
          { kelas: '' }
        ] 
      },
      orderBy: { name: 'asc' },
    });
  } catch (error) {
    console.error('Error fetching available students:', error);
    return [];
  }
}

export async function addStudentToKelas(userId: string, kelasNama: string) {
  try {
    const db = getDb();
    await db.user.update({
      where: { id: userId },
      data: { kelas: kelasNama },
    });

    // Update count
    const count = await db.user.count({
      where: { kelas: kelasNama, role: 'siswa' },
    });

    await db.kelas.update({
      where: { nama: kelasNama },
      data: { jumlahSiswa: count },
    });

    revalidatePath('/admin/kelas');
    return { success: true };
  } catch (error) {
    console.error('Error adding student to kelas:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Gagal menambah siswa' };
  }
}

export async function removeStudentFromKelas(userId: string, kelasNama: string) {
  try {
    const db = getDb();
    await db.user.update({
      where: { id: userId },
      data: { kelas: null },
    });

    // Update count
    const count = await db.user.count({
      where: { kelas: kelasNama, role: 'siswa' },
    });

    await db.kelas.update({
      where: { nama: kelasNama },
      data: { jumlahSiswa: count },
    });

    revalidatePath('/admin/kelas');
    return { success: true };
  } catch (error) {
    console.error('Error removing student from kelas:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Gagal menghapus siswa' };
  }
}
