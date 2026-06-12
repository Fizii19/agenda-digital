CREATE TABLE `presensigurumapel` (
  `id` VARCHAR(191) NOT NULL,
  `tanggal` VARCHAR(191) NOT NULL,
  `kelasId` VARCHAR(191) NOT NULL,
  `scheduleId` VARCHAR(191) NOT NULL,
  `guruId` VARCHAR(191) NOT NULL,
  `status` VARCHAR(191) NOT NULL,
  `keterangan` VARCHAR(191) NULL,
  `inputBy` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `PresensiGuruMapel_tanggal_scheduleId_key`(`tanggal`, `scheduleId`),
  INDEX `PresensiGuruMapel_kelasId_fkey`(`kelasId`),
  INDEX `PresensiGuruMapel_scheduleId_fkey`(`scheduleId`),
  INDEX `PresensiGuruMapel_guruId_fkey`(`guruId`),
  INDEX `PresensiGuruMapel_inputBy_fkey`(`inputBy`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `presensigurumapel`
  ADD CONSTRAINT `PresensiGuruMapel_kelasId_fkey`
  FOREIGN KEY (`kelasId`) REFERENCES `kelas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `presensigurumapel`
  ADD CONSTRAINT `PresensiGuruMapel_scheduleId_fkey`
  FOREIGN KEY (`scheduleId`) REFERENCES `schedule`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `presensigurumapel`
  ADD CONSTRAINT `PresensiGuruMapel_guruId_fkey`
  FOREIGN KEY (`guruId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `presensigurumapel`
  ADD CONSTRAINT `PresensiGuruMapel_inputBy_fkey`
  FOREIGN KEY (`inputBy`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
