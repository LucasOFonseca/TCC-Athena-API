-- DropForeignKey
ALTER TABLE `periods` DROP FOREIGN KEY `periods_classroom_guid_fkey`;

-- DropForeignKey
ALTER TABLE `periods` DROP FOREIGN KEY `periods_matrix_module_guid_fkey`;

-- DropForeignKey
ALTER TABLE `periods` DROP FOREIGN KEY `periods_shift_guid_fkey`;

-- AlterTable
ALTER TABLE `periods` MODIFY `status` ENUM('draft', 'notStarted', 'openForEnrollment', 'inProgress', 'finished', 'canceled') NOT NULL DEFAULT 'notStarted',
    MODIFY `enrollment_start_date` DATETIME(3) NULL,
    MODIFY `enrollment_end_date` DATETIME(3) NULL,
    MODIFY `deadline` DATETIME(3) NULL,
    MODIFY `vacancies` INTEGER NULL,
    MODIFY `matrix_module_guid` VARCHAR(191) NULL,
    MODIFY `class_id` VARCHAR(191) NULL,
    MODIFY `classroom_guid` VARCHAR(191) NULL,
    MODIFY `shift_guid` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `periods` ADD CONSTRAINT `periods_matrix_module_guid_fkey` FOREIGN KEY (`matrix_module_guid`) REFERENCES `matrix_modules`(`guid`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `periods` ADD CONSTRAINT `periods_classroom_guid_fkey` FOREIGN KEY (`classroom_guid`) REFERENCES `classrooms`(`guid`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `periods` ADD CONSTRAINT `periods_shift_guid_fkey` FOREIGN KEY (`shift_guid`) REFERENCES `shifts`(`guid`) ON DELETE SET NULL ON UPDATE CASCADE;
