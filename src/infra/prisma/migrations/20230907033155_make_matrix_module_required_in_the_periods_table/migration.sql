/*
  Warnings:

  - Made the column `matrix_module_guid` on table `periods` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `periods` DROP FOREIGN KEY `periods_matrix_module_guid_fkey`;

-- AlterTable
ALTER TABLE `periods` MODIFY `matrix_module_guid` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `periods` ADD CONSTRAINT `periods_matrix_module_guid_fkey` FOREIGN KEY (`matrix_module_guid`) REFERENCES `matrix_modules`(`guid`) ON DELETE RESTRICT ON UPDATE CASCADE;
