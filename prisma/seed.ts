import prisma from '../lib/prisma';
import { users, kelasList, agendaList } from '../lib/mock-data';

async function main() {
  console.log('Seeding data...');

  // 1. Seed Kelas
  for (const kelas of kelasList) {
    await prisma.kelas.upsert({
      where: { nama: kelas.nama },
      update: {},
      create: {
        id: kelas.id,
        nama: kelas.nama,
        tingkat: kelas.tingkat,
        jurusan: kelas.jurusan,
        waliKelas: kelas.waliKelas,
        jumlahSiswa: kelas.jumlahSiswa,
        tahunAjaran: kelas.tahunAjaran,
      },
    });
  }
  console.log('Kelas seeded.');

  // 2. Seed Users
  for (const user of users) {
    await prisma.user.upsert({
      where: { 
        id: user.id
      },
      update: {},
      create: {
        id: user.id,
        name: user.name,
        email: user.email,
        nis: user.nis,
        nip: user.nip,
        role: user.role,
        avatar: user.avatar,
        kelas: user.kelas,
      },
    });
  }
  console.log('Users seeded.');

  // 3. Seed Agendas
  for (const agenda of agendaList) {
    const createdUser = await prisma.user.findFirst({
        where: { name: agenda.createdBy }
    });

    if (createdUser) {
        await prisma.agenda.create({
          data: {
            id: agenda.id,
            kelas: agenda.kelas,
            tanggal: agenda.tanggal,
            createdBy: createdUser.id,
            items: {
              create: agenda.items.map(item => ({
                jamMulai: item.jamMulai,
                jamSelesai: item.jamSelesai,
                kegiatan: item.kegiatan,
                keterangan: item.keterangan,
              })),
            },
          },
        });
    }
  }
  console.log('Agendas seeded.');

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
