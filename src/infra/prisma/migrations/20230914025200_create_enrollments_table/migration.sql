-- CreateTable
CREATE TABLE `enrollments` (
    `guid` VARCHAR(191) NOT NULL,
    `enrollment_number` INTEGER NOT NULL,
    `course_guid` VARCHAR(191) NOT NULL,
    `student_guid` VARCHAR(191) NOT NULL,
    `period_guid` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `enrollments_enrollment_number_key`(`enrollment_number`),
    PRIMARY KEY (`guid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `enrollments` ADD CONSTRAINT `enrollments_course_guid_fkey` FOREIGN KEY (`course_guid`) REFERENCES `courses`(`guid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `enrollments` ADD CONSTRAINT `enrollments_student_guid_fkey` FOREIGN KEY (`student_guid`) REFERENCES `students`(`guid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `enrollments` ADD CONSTRAINT `enrollments_period_guid_fkey` FOREIGN KEY (`period_guid`) REFERENCES `periods`(`guid`) ON DELETE SET NULL ON UPDATE CASCADE;
