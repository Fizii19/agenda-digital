'use server';

import prisma from '@/lib/prisma';
import { Role } from '@/lib/types';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function loginAction(identifier: string, role: Role) {
  try {
    const user = await prisma.user.findFirst({
      where: {
        role: role,
        OR: [
          { nip: identifier },
          { nis: identifier }
        ]
      }
    });

    if (!user) {
      return { success: false, error: 'NIS/NIP tidak ditemukan untuk peran ini.' };
    }

    // In a real app, we would verify the password here
    // For now, we'll just set the cookies
    (await cookies()).set('userRole', user.role, { path: '/' });
    (await cookies()).set('userName', user.name, { path: '/' });
    (await cookies()).set('userId', user.id, { path: '/' });

    return { success: true, role: user.role };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'Terjadi kesalahan pada server.' };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('userRole');
  cookieStore.delete('userName');
  cookieStore.delete('userId');
}

export async function getAgendas(kelas?: string) {
  try {
    const agendas = await prisma.agenda.findMany({
      where: kelas ? { kelas } : {},
      include: {
        items: true,
      },
      orderBy: {
        tanggal: 'desc'
      }
    });

    // Transform for UI consistency if needed
    return agendas.map(a => ({
      ...a,
      createdBy: a.createdBy // This is the ID, in the UI we might want the name
    }));
  } catch (error) {
    console.error('Fetch agendas error:', error);
    return [];
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
        kelas: data.kelas,
        tanggal: data.tanggal,
        createdBy: data.userId,
        items: {
          create: data.items
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
        items: {
          create: data.items
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
        select: { id: true, name: true, role: true, role: true }
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
      ...agendas.map(a => ({ id: a.id, title: `Agenda ${a.kelas}`, sub: a.tanggal, type: 'agenda', href: `/admin/jadwal` })), 
      ...users.map(u => ({ id: u.id, title: u.name, sub: u.role, type: 'user', href: u.role === 'siswa' ? '/admin/siswa' : '/admin/guru' })),
      ...classes.map(c => ({ id: c.id, title: `Kelas ${c.nama}`, sub: 'Manajemen Kelas', type: 'kelas', href: '/admin/kelas' }))
    ];

    return { success: true, results };
  } catch (error) {
    console.error('Global search error:', error);
    return { success: false, results: [] };
  }
}
