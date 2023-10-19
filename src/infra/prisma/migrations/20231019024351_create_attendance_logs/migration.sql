-- CreateTable
CREATE TABLE `student_absences` (
    `guid` VARCHAR(191) NOT NULL,
    `total_absences` INTEGER NOT NULL,
    `student_guid` VARCHAR(191) NOT NULL,
    `attendance_log_guid` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`guid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attendance_logs` (
    `guid` VARCHAR(191) NOT NULL,
    `class_date` DATETIME(3) NOT NULL,
    `total_classes` INTEGER NOT NULL,
    `period_guid` VARCHAR(191) NOT NULL,
    `discipline_guid` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`guid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `student_absences` ADD CONSTRAINT `student_absences_student_guid_fkey` FOREIGN KEY (`student_guid`) REFERENCES `students`(`guid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_absences` ADD CONSTRAINT `student_absences_attendance_log_guid_fkey` FOREIGN KEY (`attendance_log_guid`) REFERENCES `attendance_logs`(`guid`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance_logs` ADD CONSTRAINT `attendance_logs_period_guid_fkey` FOREIGN KEY (`period_guid`) REFERENCES `periods`(`guid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance_logs` ADD CONSTRAINT `attendance_logs_discipline_guid_fkey` FOREIGN KEY (`discipline_guid`) REFERENCES `disciplines`(`guid`) ON DELETE RESTRICT ON UPDATE CASCADE;
