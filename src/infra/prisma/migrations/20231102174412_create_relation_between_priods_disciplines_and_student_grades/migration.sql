/*
  Warnings:

  - Added the required column `discipline_guid` to the `student_grades` table without a default value. This is not possible if the table is not empty.
  - Added the required column `period_guid` to the `student_grades` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `student_grades` ADD COLUMN `discipline_guid` VARCHAR(191) NOT NULL,
    ADD COLUMN `period_guid` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `student_grades` ADD CONSTRAINT `student_grades_discipline_guid_fkey` FOREIGN KEY (`discipline_guid`) REFERENCES `disciplines`(`guid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_grades` ADD CONSTRAINT `student_grades_period_guid_fkey` FOREIGN KEY (`period_guid`) REFERENCES `periods`(`guid`) ON DELETE RESTRICT ON UPDATE CASCADE;
