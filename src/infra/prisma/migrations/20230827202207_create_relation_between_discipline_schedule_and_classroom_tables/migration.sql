/*
  Warnings:

  - Added the required column `classroom_guid` to the `discipline_schedules` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `discipline_schedules` ADD COLUMN `classroom_guid` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `discipline_schedules` ADD CONSTRAINT `discipline_schedules_classroom_guid_fkey` FOREIGN KEY (`classroom_guid`) REFERENCES `classrooms`(`guid`) ON DELETE RESTRICT ON UPDATE CASCADE;
