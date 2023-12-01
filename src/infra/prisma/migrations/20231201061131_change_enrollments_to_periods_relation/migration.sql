/*
  Warnings:

  - You are about to drop the column `period_guid` on the `enrollments` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `enrollments` DROP FOREIGN KEY `enrollments_period_guid_fkey`;

-- AlterTable
ALTER TABLE `enrollments` DROP COLUMN `period_guid`;

-- CreateTable
CREATE TABLE `_EnrollmentToPeriod` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_EnrollmentToPeriod_AB_unique`(`A`, `B`),
    INDEX `_EnrollmentToPeriod_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_EnrollmentToPeriod` ADD CONSTRAINT `_EnrollmentToPeriod_A_fkey` FOREIGN KEY (`A`) REFERENCES `enrollments`(`guid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_EnrollmentToPeriod` ADD CONSTRAINT `_EnrollmentToPeriod_B_fkey` FOREIGN KEY (`B`) REFERENCES `periods`(`guid`) ON DELETE CASCADE ON UPDATE CASCADE;
