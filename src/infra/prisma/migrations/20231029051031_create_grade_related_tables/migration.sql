-- CreateTable
CREATE TABLE `grade_items` (
    `guid` VARCHAR(191) NOT NULL,
    `type` ENUM('sum', 'average') NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `max_value` DOUBLE NOT NULL,
    `discipline_grade_config_guid` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`guid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `discipline_grade_configs` (
    `guid` VARCHAR(191) NOT NULL,
    `period_guid` VARCHAR(191) NOT NULL,
    `discipline_guid` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`guid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_grade_items` (
    `guid` VARCHAR(191) NOT NULL,
    `value` DOUBLE NOT NULL,
    `grade_item_guid` VARCHAR(191) NOT NULL,
    `student_grade_guid` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`guid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_grades` (
    `guid` VARCHAR(191) NOT NULL,
    `final_value` DOUBLE NOT NULL,
    `student_guid` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`guid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `grade_items` ADD CONSTRAINT `grade_items_discipline_grade_config_guid_fkey` FOREIGN KEY (`discipline_grade_config_guid`) REFERENCES `discipline_grade_configs`(`guid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `discipline_grade_configs` ADD CONSTRAINT `discipline_grade_configs_period_guid_fkey` FOREIGN KEY (`period_guid`) REFERENCES `periods`(`guid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `discipline_grade_configs` ADD CONSTRAINT `discipline_grade_configs_discipline_guid_fkey` FOREIGN KEY (`discipline_guid`) REFERENCES `disciplines`(`guid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_grade_items` ADD CONSTRAINT `student_grade_items_grade_item_guid_fkey` FOREIGN KEY (`grade_item_guid`) REFERENCES `grade_items`(`guid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_grade_items` ADD CONSTRAINT `student_grade_items_student_grade_guid_fkey` FOREIGN KEY (`student_grade_guid`) REFERENCES `student_grades`(`guid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_grades` ADD CONSTRAINT `student_grades_student_guid_fkey` FOREIGN KEY (`student_guid`) REFERENCES `students`(`guid`) ON DELETE RESTRICT ON UPDATE CASCADE;
