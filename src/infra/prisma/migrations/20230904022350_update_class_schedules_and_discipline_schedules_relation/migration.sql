/*
  Warnings:

  - You are about to drop the column `discipline_schedule_guid` on the `class_schedules` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `class_schedules` DROP FOREIGN KEY `class_schedules_discipline_schedule_guid_fkey`;

-- AlterTable
ALTER TABLE `class_schedules` DROP COLUMN `discipline_schedule_guid`;

-- CreateTable
CREATE TABLE `_ClassScheduleToDisciplineSchedule` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_ClassScheduleToDisciplineSchedule_AB_unique`(`A`, `B`),
    INDEX `_ClassScheduleToDisciplineSchedule_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_ClassScheduleToDisciplineSchedule` ADD CONSTRAINT `_ClassScheduleToDisciplineSchedule_A_fkey` FOREIGN KEY (`A`) REFERENCES `class_schedules`(`guid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ClassScheduleToDisciplineSchedule` ADD CONSTRAINT `_ClassScheduleToDisciplineSchedule_B_fkey` FOREIGN KEY (`B`) REFERENCES `discipline_schedules`(`guid`) ON DELETE CASCADE ON UPDATE CASCADE;
