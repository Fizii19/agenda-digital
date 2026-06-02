'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

function getDb() {
  return (prisma as typeof prisma & { default?: typeof prisma }).default ?? prisma;
}

export async function getKelasWithScheduleCount() {
  const db = getDb();

  try {
    const kelas = await db.kelas.findMany({
      include: {
        _count: {
          select: { subjects: true } // This is not quite right, we want schedule count
        },
        subjects: {
          include: {
            _count: {
              select: { schedules: true }
            }
          }
        }
      },
      orderBy: { nama: 'asc' }
    });

    return kelas.map(k => ({
      id: k.id,
      nama: k.nama,
      tingkat: k.tingkat,
      jurusan: k.jurusan,
      scheduleCount: k.subjects.reduce((acc, s) => acc + s._count.schedules, 0)
    }));
  } catch (error) {
    console.error('Error fetching kelas schedule count:', error);
    return [];
  }
}

export async function getJadwalByKelas(kelasId: string) {
  const db = getDb();

  try {
    return await db.schedule.findMany({
      where: {
        subject: {
          kelasId: kelasId
        }
      },
      include: {
        subject: {
          include: {
            guru: {
              select: { name: true }
            }
          }
        },
        ruangan: {
          select: { nama: true }
        }
      },
      orderBy: [
        { hari: 'asc' },
        { jamMulai: 'asc' }
      ]
    });
  } catch (error) {
    console.error('Error fetching jadwal by kelas:', error);
    return [];
  }
}

export async function getRuanganList() {
    const db = getDb();

    try {
        const ruangans = await db.ruangan.findMany({
            where: { aktif: true },
        });

        return ruangans.sort((a, b) => {
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

export async function getSubjectsByKelas(kelasId: string) {
    const db = getDb();

    try {
        return await db.subject.findMany({
            where: { kelasId },
            include: {
                guru: { select: { name: true } }
            },
            orderBy: { nama: 'asc' }
        });
    } catch (error) {
        console.error('Error fetching subjects by kelas:', error);
        return [];
    }
}

async function checkConflicts(data: {
    hari: string,
    jamMulai: string,
    jamSelesai: string,
    ruanganId?: string | null,
    guruId: string,
    excludeScheduleId?: string
}) {
    const db = getDb();
    const { hari, jamMulai, jamSelesai, ruanganId, guruId, excludeScheduleId } = data;

    // 1. Check Room Conflict
    if (ruanganId) {
        const roomConflict = await db.schedule.findFirst({
            where: {
                id: { not: excludeScheduleId },
                hari,
                ruanganId,
                AND: [
                    { jamMulai: { lt: jamSelesai } },
                    { jamSelesai: { gt: jamMulai } }
                ]
            },
            include: {
                subject: { select: { nama: true, kelas: { select: { nama: true } } } }
            }
        });

        if (roomConflict) {
            return { 
                conflict: true, 
                message: `Ruangan sudah digunakan oleh kelas ${roomConflict.subject.kelas.nama} (${roomConflict.subject.nama})` 
            };
        }
    }

    // 2. Check Teacher Conflict
    const teacherConflict = await db.schedule.findFirst({
        where: {
            id: { not: excludeScheduleId },
            hari,
            subject: {
                guruId: guruId
            },
            AND: [
                { jamMulai: { lt: jamSelesai } },
                { jamSelesai: { gt: jamMulai } }
            ]
        },
        include: {
            subject: { select: { nama: true, kelas: { select: { nama: true } } } }
        }
    });

    if (teacherConflict) {
        return { 
            conflict: true, 
            message: `Guru sudah mengajar di kelas ${teacherConflict.subject.kelas.nama} (${teacherConflict.subject.nama})` 
        };
    }

    return { conflict: false };
}

export async function createSchedule(data: {
  hari: string;
  jamMulai: string;
  jamSelesai: string;
  subjectId: string;
  ruanganId?: string | null;
}) {
  const db = getDb();

  try {
    const subject = await db.subject.findUnique({
        where: { id: data.subjectId },
        select: { guruId: true }
    });

    if (!subject) return { success: false, error: 'Mata pelajaran tidak ditemukan' };

    const conflict = await checkConflicts({
        hari: data.hari,
        jamMulai: data.jamMulai,
        jamSelesai: data.jamSelesai,
        ruanganId: data.ruanganId,
        guruId: subject.guruId
    });

    if (conflict.conflict) return { success: false, error: conflict.message };

    await db.schedule.create({
      data: {
        id: crypto.randomUUID(),
        hari: data.hari,
        jamMulai: data.jamMulai,
        jamSelesai: data.jamSelesai,
        subjectId: data.subjectId,
        ruanganId: data.ruanganId,
      },
    });
    revalidatePath('/admin/jadwal');
    return { success: true };
  } catch (error) {
    console.error('Error creating schedule:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Gagal membuat jadwal' };
  }
}

export async function updateSchedule(id: string, data: {
    hari: string;
    jamMulai: string;
    jamSelesai: string;
    subjectId: string;
    ruanganId?: string | null;
}) {
    const db = getDb();

    try {
        const subject = await db.subject.findUnique({
            where: { id: data.subjectId },
            select: { guruId: true }
        });
    
        if (!subject) return { success: false, error: 'Mata pelajaran tidak ditemukan' };
    
        const conflict = await checkConflicts({
            hari: data.hari,
            jamMulai: data.jamMulai,
            jamSelesai: data.jamSelesai,
            ruanganId: data.ruanganId,
            guruId: subject.guruId,
            excludeScheduleId: id
        });
    
        if (conflict.conflict) return { success: false, error: conflict.message };

        await db.schedule.update({
            where: { id },
            data: {
                hari: data.hari,
                jamMulai: data.jamMulai,
                jamSelesai: data.jamSelesai,
                subjectId: data.subjectId,
                ruanganId: data.ruanganId,
            }
        });
        revalidatePath('/admin/jadwal');
        return { success: true };
    } catch (error) {
        console.error('Error updating schedule:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Gagal memperbarui jadwal' };
    }
}

export async function deleteSchedule(id: string) {
    const db = getDb();

    try {
        await db.schedule.delete({ where: { id } });
        revalidatePath('/admin/jadwal');
        return { success: true };
    } catch (error) {
        console.error('Error deleting schedule:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Gagal menghapus jadwal' };
    }
}

export async function importJadwalCSV(formData: FormData) {
    const db = getDb();
    const file = formData.get('file') as File;
    if (!file) return { success: false, error: 'File tidak ditemukan' };

    const text = await file.text();
    const rows = text.split('\n').map(r => r.split(',')).filter(r => r.length >= 5);
    
    // Skip header
    const dataRows = rows.slice(1);
    
    let successCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < dataRows.length; i++) {
        const [hari, jamMulai, jamSelesai, kelasNama, mapelNama, ruanganNama] = dataRows[i].map(s => s.trim());
        
        try {
            // Find kelas
            const kelas = await db.kelas.findUnique({ where: { nama: kelasNama } });
            if (!kelas) {
                errors.push(`Baris ${i+2}: Kelas '${kelasNama}' tidak ditemukan`);
                continue;
            }

            // Find subject
            const subject = await db.subject.findFirst({
                where: { 
                    nama: mapelNama,
                    kelasId: kelas.id
                }
            });
            if (!subject) {
                errors.push(`Baris ${i+2}: Mapel '${mapelNama}' untuk kelas '${kelasNama}' tidak ditemukan di Manajemen Mapel`);
                continue;
            }

            // Find ruangan
            let ruanganId = null;
            if (ruanganNama) {
                const ruangan = await db.ruangan.findUnique({ where: { nama: ruanganNama } });
                if (ruangan) {
                    ruanganId = ruangan.id;
                } else {
                    errors.push(`Baris ${i+2}: Ruangan '${ruanganNama}' tidak ditemukan`);
                    continue;
                }
            }

            // Check conflict
            const conflict = await checkConflicts({
                hari,
                jamMulai,
                jamSelesai,
                ruanganId,
                guruId: subject.guruId
            });

            if (conflict.conflict) {
                errors.push(`Baris ${i+2}: Bentrok - ${conflict.message}`);
                continue;
            }

            // Create
            await db.schedule.create({
                data: {
                    id: crypto.randomUUID(),
                    hari,
                    jamMulai,
                    jamSelesai,
                    subjectId: subject.id,
                    ruanganId
                }
            });
            successCount++;

        } catch (error) {
            errors.push(`Baris ${i+2}: Error sistem - ${error instanceof Error ? error.message : 'Tidak diketahui'}`);
        }
    }

    revalidatePath('/admin/jadwal');
    return { success: true, imported: successCount, errors };
}
