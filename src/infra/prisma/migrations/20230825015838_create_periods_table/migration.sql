-- AlterTable
ALTER TABLE `class_schedules` ADD COLUMN `discipline_schedule_guid` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `discipline_schedules` (
    `guid` VARCHAR(191) NOT NULL,
    `employee_guid` VARCHAR(191) NOT NULL,
    `period_guid` VARCHAR(191) NOT NULL,
    `discipline_guid` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`guid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `periods` (
    `guid` VARCHAR(191) NOT NULL,
    `status` ENUM('notStarted', 'openForEnrollment', 'inProgress', 'finished', 'canceled') NOT NULL DEFAULT 'notStarted',
    `enrollment_start_date` DATETIME(3) NOT NULL,
    `enrollment_end_date` DATETIME(3) NOT NULL,
    `deadline` DATETIME(3) NOT NULL,
    `vacancies` INTEGER NOT NULL,
    `matrix_module_guid` VARCHAR(191) NOT NULL,
    `class_id` VARCHAR(191) NOT NULL,
    `classroom_guid` VARCHAR(191) NOT NULL,
    `shift_guid` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`guid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `class_schedules` ADD CONSTRAINT `class_schedules_discipline_schedule_guid_fkey` FOREIGN KEY (`discipline_schedule_guid`) REFERENCES `discipline_schedules`(`guid`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `discipline_schedules` ADD CONSTRAINT `discipline_schedules_employee_guid_fkey` FOREIGN KEY (`employee_guid`) REFERENCES `employees`(`guid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `discipline_schedules` ADD CONSTRAINT `discipline_schedules_period_guid_fkey` FOREIGN KEY (`period_guid`) REFERENCES `periods`(`guid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `discipline_schedules` ADD CONSTRAINT `discipline_schedules_discipline_guid_fkey` FOREIGN KEY (`discipline_guid`) REFERENCES `disciplines`(`guid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `periods` ADD CONSTRAINT `periods_matrix_module_guid_fkey` FOREIGN KEY (`matrix_module_guid`) REFERENCES `matrix_modules`(`guid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `periods` ADD CONSTRAINT `periods_classroom_guid_fkey` FOREIGN KEY (`classroom_guid`) REFERENCES `classrooms`(`guid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `periods` ADD CONSTRAINT `periods_shift_guid_fkey` FOREIGN KEY (`shift_guid`) REFERENCES `shifts`(`guid`) ON DELETE RESTRICT ON UPDATE CASCADE;
