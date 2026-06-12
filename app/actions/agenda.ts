'use server';

import prisma from '@/lib/prisma';
import type { Role } from '@/lib/types';
import { roleDashboards, uniqueRoles } from '@/lib/roles';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

const hariByIndex = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const allowedPresensiGuruStatuses = ['Hadir', 'Tidak Hadir', 'Digantikan', 'Tugas Mandiri', 'Ditiadakan'];

function getHariFromDate(date: string) {
  return hariByIndex[new Date(`${date}T00:00:00`).getDay()] ?? 'Senin';
}

async function getCurrentUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  if (!userId) return null;

  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      kelasAktif: true,
      additionalRoles: {
        select: { role: true },
      },
    },
  });
}

export async function loginAction(identifier: string, role: Role) {
  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { role },
          { additionalRoles: { some: { role } } },
        ],
        AND: {
          OR: [
            { nip: identifier },
            { nis: identifier }
          ]
        }
      },
      include: {
        additionalRoles: {
          select: { role: true },
        },
      },
    });

    if (!user) {
      return { success: false, error: 'NIS/NIP tidak ditemukan untuk peran ini.' };
    }

    const availableRoles = uniqueRoles(user.role, user.additionalRoles.map((item) => item.role));

    if (!availableRoles.includes(role)) {
      return { success: false, error: 'Akun ini belum memiliki akses ke peran tersebut.' };
    }

    const cookieStore = await cookies();
    cookieStore.set('userRole', role, { path: '/' });
    cookieStore.set('userRoles', availableRoles.join(','), { path: '/' });
    cookieStore.set('userName', user.name, { path: '/' });
    cookieStore.set('userId', user.id, { path: '/' });

    return { success: true, role };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'Terjadi kesalahan pada server.' };
  }
}

export async function switchRoleAction(role: Role) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  if (!userId) {
    return { success: false, error: 'Sesi tidak ditemukan.' };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      additionalRoles: {
        select: { role: true },
      },
    },
  });

  if (!user) {
    return { success: false, error: 'User tidak ditemukan.' };
  }

  const availableRoles = uniqueRoles(user.role, user.additionalRoles.map((item) => item.role));

  if (!availableRoles.includes(role)) {
    return { success: false, error: 'Akses peran tidak tersedia.' };
  }

  cookieStore.set('userRole', role, { path: '/' });
  cookieStore.set('userRoles', availableRoles.join(','), { path: '/' });

  return { success: true, role, href: roleDashboards[role] };
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('userRole');
  cookieStore.delete('userRoles');
  cookieStore.delete('userName');
  cookieStore.delete('userId');
}

export async function getAgendas(kelas?: string) {
  try {
    const agendas = await prisma.agenda.findMany({
      where: kelas ? { kelas } : {},
      include: {
        agendaitem: true,
      },
      orderBy: {
        tanggal: 'desc'
      }
    });

    // Transform for UI consistency to match Agenda type
    return agendas.map(a => ({
      id: a.id,
      kelas: a.kelas,
      tanggal: a.tanggal,
      createdBy: a.createdBy,
      createdAt: a.createdAt.toISOString(),
      items: a.agendaitem.map(item => ({
        jamMulai: item.jamMulai,
        jamSelesai: item.jamSelesai,
        kegiatan: item.kegiatan,
        keterangan: item.keterangan || undefined,
      }))
    }));
  } catch (error) {
    console.error('Fetch agendas error:', error);
    return [];
  }
}

export async function getSekretarisAgendaContext(tanggal: string) {
  const user = await getCurrentUser();
  const roles = user ? uniqueRoles(user.role, user.additionalRoles.map((item) => item.role)) : [];

  if (!user || !roles.includes('sekretaris')) {
    return { success: false, error: 'Akses ditolak.' };
  }

  const tahunAjaranAktif = await prisma.tahunajaran.findFirst({
    where: { aktif: true },
    select: { id: true, nama: true },
  });

  if (!user.kelasId) {
    return {
      success: true,
      userKelasId: null,
      tahunAjaranAktif,
      selectedKelas: null,
      hari: getHariFromDate(tanggal),
      jadwal: [],
      agendaHariIni: null,
      recentAgendas: [],
    };
  }

  const selectedKelas = await prisma.kelas.findUnique({
    where: { id: user.kelasId },
    select: {
      id: true,
      nama: true,
      tahunAjaran: true,
      jumlahSiswa: true,
    },
  });
  const hari = getHariFromDate(tanggal);

  const [jadwal, agendaHariIni, recentAgendas, presensiGuruMapel] = await Promise.all([
    selectedKelas
      ? prisma.schedule.findMany({
          where: {
            hari,
            subject: {
              kelasId: selectedKelas.id,
            },
          },
          include: {
            subject: {
              include: {
                guru: {
                  select: { name: true },
                },
              },
            },
            ruangan: {
              select: { nama: true },
            },
          },
          orderBy: { jamMulai: 'asc' },
        })
      : Promise.resolve([]),
    selectedKelas
      ? prisma.agenda.findFirst({
          where: {
            kelas: selectedKelas.nama,
            tanggal,
          },
          include: {
            agendaitem: {
              orderBy: { jamMulai: 'asc' },
            },
            user: {
              select: { name: true },
            },
          },
          orderBy: { updatedAt: 'desc' },
        })
      : Promise.resolve(null),
    selectedKelas
      ? prisma.agenda.findMany({
          where: { kelas: selectedKelas.nama },
          include: {
            agendaitem: {
              orderBy: { jamMulai: 'asc' },
            },
            user: {
              select: { name: true },
            },
          },
          orderBy: { tanggal: 'desc' },
          take: 7,
        })
      : Promise.resolve([]),
    selectedKelas
      ? prisma.presensigurumapel.findMany({
          where: {
            kelasId: selectedKelas.id,
            tanggal,
          },
          select: {
            scheduleId: true,
            status: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const keteranganBySchedule = new Map(
    (agendaHariIni?.agendaitem ?? []).map((item) => [`${item.jamMulai}::${item.jamSelesai}::${item.kegiatan}`, item.keterangan ?? ''])
  );
  const presensiByScheduleId = new Map(presensiGuruMapel.map((item) => [item.scheduleId, item.status]));

  return {
    success: true,
    userKelasId: user.kelasId,
    tahunAjaranAktif,
    selectedKelas,
    hari,
    jadwal: jadwal.map((item) => ({
      id: item.id,
      jamMulai: item.jamMulai,
      jamSelesai: item.jamSelesai,
      subject: item.subject.nama,
      guru: item.subject.guru.name,
      ruangan: item.ruangan?.nama ?? '',
      keterangan: keteranganBySchedule.get(`${item.jamMulai}::${item.jamSelesai}::${item.subject.nama}`) ?? '',
      statusGuru: presensiByScheduleId.get(item.id) ?? 'Hadir',
    })),
    agendaHariIni: agendaHariIni ? {
      id: agendaHariIni.id,
      kelas: agendaHariIni.kelas,
      tanggal: agendaHariIni.tanggal,
      createdBy: agendaHariIni.user.name,
      updatedAt: agendaHariIni.updatedAt.toISOString(),
      items: agendaHariIni.agendaitem.map((item) => ({
        jamMulai: item.jamMulai,
        jamSelesai: item.jamSelesai,
        kegiatan: item.kegiatan,
        keterangan: item.keterangan ?? '',
      })),
    } : null,
    recentAgendas: recentAgendas.map((agenda) => ({
      id: agenda.id,
      kelas: agenda.kelas,
      tanggal: agenda.tanggal,
      createdBy: agenda.user.name,
      itemCount: agenda.agendaitem.length,
      updatedAt: agenda.updatedAt.toISOString(),
    })),
  };
}

export async function saveSekretarisAgenda(data: {
  kelasId: string;
  tanggal: string;
  items: { scheduleId: string; statusGuru?: string; keterangan?: string }[];
}) {
  const user = await getCurrentUser();
  const roles = user ? uniqueRoles(user.role, user.additionalRoles.map((item) => item.role)) : [];

  if (!user || !roles.includes('sekretaris')) {
    return { success: false, error: 'Akses ditolak.' };
  }

  if (!user.kelasId) {
    return { success: false, error: 'Akun sekretaris belum terhubung ke kelas.' };
  }

  if (!data.kelasId || data.kelasId !== user.kelasId) {
    return { success: false, error: 'Sekretaris hanya boleh mengatur agenda kelas sendiri.' };
  }

  if (!data.tanggal) {
    return { success: false, error: 'Tanggal wajib dipilih.' };
  }

  const kelas = await prisma.kelas.findUnique({
    where: { id: data.kelasId },
    select: { id: true, nama: true },
  });

  if (!kelas) {
    return { success: false, error: 'Kelas tidak ditemukan.' };
  }

  try {
    const hari = getHariFromDate(data.tanggal);
    const schedules = await prisma.schedule.findMany({
      where: {
        hari,
        subject: { kelasId: kelas.id },
      },
      include: {
        subject: {
          select: { nama: true, guruId: true },
        },
      },
      orderBy: { jamMulai: 'asc' },
    });

    if (schedules.length === 0) {
      return { success: false, error: `Belum ada jadwal untuk hari ${hari}.` };
    }

    const noteByScheduleId = new Map(data.items.map((item) => [item.scheduleId, item.keterangan?.trim() || null]));
    const statusByScheduleId = new Map(data.items.map((item) => [
      item.scheduleId,
      allowedPresensiGuruStatuses.includes(item.statusGuru ?? '') ? item.statusGuru! : 'Hadir',
    ]));
    const agendaItems = schedules.map((schedule) => ({
      id: crypto.randomUUID(),
      jamMulai: schedule.jamMulai,
      jamSelesai: schedule.jamSelesai,
      kegiatan: schedule.subject.nama,
      keterangan: noteByScheduleId.get(schedule.id) ?? null,
    }));

    const existing = await prisma.agenda.findFirst({
      where: {
        kelas: kelas.nama,
        tanggal: data.tanggal,
      },
      select: { id: true },
    });

    if (existing) {
      await prisma.$transaction([
        prisma.agendaitem.deleteMany({
          where: { agendaId: existing.id },
        }),
        prisma.agenda.update({
          where: { id: existing.id },
          data: {
            updatedAt: new Date(),
            agendaitem: {
              create: agendaItems,
            },
          },
        }),
        ...schedules.map((schedule) => prisma.presensigurumapel.upsert({
          where: {
            tanggal_scheduleId: {
              tanggal: data.tanggal,
              scheduleId: schedule.id,
            },
          },
          update: {
            kelasId: kelas.id,
            guruId: schedule.subject.guruId,
            status: statusByScheduleId.get(schedule.id) ?? 'Hadir',
            keterangan: noteByScheduleId.get(schedule.id) ?? null,
            inputBy: user.id,
          },
          create: {
            id: crypto.randomUUID(),
            tanggal: data.tanggal,
            kelasId: kelas.id,
            scheduleId: schedule.id,
            guruId: schedule.subject.guruId,
            status: statusByScheduleId.get(schedule.id) ?? 'Hadir',
            keterangan: noteByScheduleId.get(schedule.id) ?? null,
            inputBy: user.id,
          },
        })),
      ]);
    } else {
      await prisma.$transaction([
        prisma.agenda.create({
          data: {
            id: crypto.randomUUID(),
            kelas: kelas.nama,
            tanggal: data.tanggal,
            createdBy: user.id,
            updatedAt: new Date(),
            agendaitem: {
              create: agendaItems,
            },
          },
        }),
        ...schedules.map((schedule) => prisma.presensigurumapel.upsert({
          where: {
            tanggal_scheduleId: {
              tanggal: data.tanggal,
              scheduleId: schedule.id,
            },
          },
          update: {
            kelasId: kelas.id,
            guruId: schedule.subject.guruId,
            status: statusByScheduleId.get(schedule.id) ?? 'Hadir',
            keterangan: noteByScheduleId.get(schedule.id) ?? null,
            inputBy: user.id,
          },
          create: {
            id: crypto.randomUUID(),
            tanggal: data.tanggal,
            kelasId: kelas.id,
            scheduleId: schedule.id,
            guruId: schedule.subject.guruId,
            status: statusByScheduleId.get(schedule.id) ?? 'Hadir',
            keterangan: noteByScheduleId.get(schedule.id) ?? null,
            inputBy: user.id,
          },
        })),
      ]);
    }

    revalidatePath('/sekretaris');
    revalidatePath('/sekretaris/agenda');
    revalidatePath('/guru/agenda');
    revalidatePath('/pimpinan/presensi-guru');

    return { success: true };
  } catch (error) {
    console.error('Save sekretaris agenda error:', error);
    return { success: false, error: 'Gagal menyimpan agenda.' };
  }
}

export async function createAgenda(data: {
  kelas: string;
  tanggal: string;
  items: { jamMulai: string; jamSelesai: string; kegiatan: string; keterangan?: string }[];
  userId: string;
}) {
  try {
    const agenda = await prisma.agenda.create({
      data: {
        id: crypto.randomUUID(),
        kelas: data.kelas,
        tanggal: data.tanggal,
        createdBy: data.userId,
        updatedAt: new Date(),
        agendaitem: {
          create: data.items.map(item => ({
            id: crypto.randomUUID(),
            jamMulai: item.jamMulai,
            jamSelesai: item.jamSelesai,
            kegiatan: item.kegiatan,
            keterangan: item.keterangan || null,
          }))
        }
      }
    });

    revalidatePath('/sekretaris/agenda');
    revalidatePath('/guru/agenda');
    return { success: true, agenda };
  } catch (error) {
    console.error('Create agenda error:', error);
    return { success: false, error: 'Gagal membuat agenda.' };
  }
}

export async function updateAgenda(id: string, data: {
  kelas: string;
  tanggal: string;
  items: { jamMulai: string; jamSelesai: string; kegiatan: string; keterangan?: string }[];
}) {
  try {
    // Delete existing items first (or handle update properly)
    await prisma.agendaitem.deleteMany({
      where: { agendaId: id }
    });

    const agenda = await prisma.agenda.update({
      where: { id },
      data: {
        kelas: data.kelas,
        tanggal: data.tanggal,
        updatedAt: new Date(),
        agendaitem: {
          create: data.items.map(item => ({
            id: crypto.randomUUID(),
            jamMulai: item.jamMulai,
            jamSelesai: item.jamSelesai,
            kegiatan: item.kegiatan,
            keterangan: item.keterangan || null,
          }))
        }
      }
    });

    revalidatePath('/sekretaris/agenda');
    revalidatePath('/guru/agenda');
    return { success: true, agenda };
  } catch (error) {
    console.error('Update agenda error:', error);
    return { success: false, error: 'Gagal memperbarui agenda.' };
  }
}

export async function deleteAgenda(id: string) {
  try {
    await prisma.agenda.delete({
      where: { id }
    });

    revalidatePath('/sekretaris/agenda');
    revalidatePath('/guru/agenda');
    return { success: true };
  } catch (error) {
    console.error('Delete agenda error:', error);
    return { success: false, error: 'Gagal menghapus agenda.' };
  }
}

export async function globalSearch(query: string) {
  if (!query || query.length < 2) return { success: true, results: [] };

  try {
    const [agendas, users, classes] = await Promise.all([
      prisma.agenda.findMany({
        where: {
          OR: [
            { kelas: { contains: query } },
          ]
        },
        take: 3,
        select: { id: true, kelas: true, tanggal: true }
      }),
      prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { nis: { contains: query } },
            { nip: { contains: query } }
          ]
        },
        take: 3,
        select: { id: true, name: true, role: true }
      }),
      prisma.kelas.findMany({
        where: {
          nama: { contains: query }
        },
        take: 3,
        select: { id: true, nama: true }
      })
    ]);

    const results = [
      ...agendas.map(a => ({ id: a.id, title: `Agenda ${a.kelas}`, sub: a.tanggal, type: 'agenda' as const, href: `/admin/jadwal` })),
      ...users.map(u => ({ id: u.id, title: u.name, sub: u.role, type: 'user' as const, href: u.role === 'siswa' ? '/admin/siswa' : '/admin/guru' })),
      ...classes.map(c => ({ id: c.id, title: `Kelas ${c.nama}`, sub: 'Manajemen Kelas', type: 'kelas' as const, href: '/admin/kelas' }))
    ];

    return { success: true, results };
  } catch (error) {
    console.error('Global search error:', error);
    return { success: false, results: [] };
  }
}
