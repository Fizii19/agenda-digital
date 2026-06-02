-- CreateTable
CREATE TABLE `tahunajaran` (
    `id` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `aktif` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `TahunAjaran_nama_key`(`nama`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `kelas` ADD COLUMN `tahunAjaranId` VARCHAR(191) NULL;

-- Backfill master data from existing class rows.
INSERT INTO `tahunajaran` (`id`, `nama`, `aktif`, `createdAt`, `updatedAt`)
SELECT
    REPLACE(UUID(), '-', ''),
    `tahunAjaran`,
    false,
    CURRENT_TIMESTAMP(3),
    CURRENT_TIMESTAMP(3)
FROM `kelas`
WHERE `tahunAjaran` IS NOT NULL AND `tahunAjaran` <> ''
GROUP BY `tahunAjaran`;

-- Mark the latest school year as active when existing data is present.
UPDATE `tahunajaran`
SET `aktif` = true, `updatedAt` = CURRENT_TIMESTAMP(3)
WHERE `nama` = (
    SELECT `nama` FROM (
        SELECT `nama` FROM `tahunajaran` ORDER BY `nama` DESC LIMIT 1
    ) AS latest_tahun_ajaran
);

-- Ensure a sensible default when there are no existing classes yet.
INSERT INTO `tahunajaran` (`id`, `nama`, `aktif`, `createdAt`, `updatedAt`)
SELECT REPLACE(UUID(), '-', ''), '2025/2026', true, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
WHERE NOT EXISTS (SELECT 1 FROM `tahunajaran`);

-- Connect classes to their master school year row.
UPDATE `kelas`
INNER JOIN `tahunajaran` ON `tahunajaran`.`nama` = `kelas`.`tahunAjaran`
SET `kelas`.`tahunAjaranId` = `tahunajaran`.`id`;

-- CreateIndex
CREATE INDEX `Kelas_tahunAjaranId_fkey` ON `kelas`(`tahunAjaranId`);

-- AddForeignKey
ALTER TABLE `kelas` ADD CONSTRAINT `Kelas_tahunAjaranId_fkey` FOREIGN KEY (`tahunAjaranId`) REFERENCES `tahunajaran`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
