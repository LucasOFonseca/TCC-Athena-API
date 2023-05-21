-- CreateTable
CREATE TABLE `matrix_modules` (
    `guid` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `matrix_guid` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`guid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `matrices` (
    `guid` VARCHAR(191) NOT NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `name` VARCHAR(120) NOT NULL,
    `course_guid` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`guid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_DisciplineToMatrixModule` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_DisciplineToMatrixModule_AB_unique`(`A`, `B`),
    INDEX `_DisciplineToMatrixModule_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `matrix_modules` ADD CONSTRAINT `matrix_modules_matrix_guid_fkey` FOREIGN KEY (`matrix_guid`) REFERENCES `matrices`(`guid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `matrices` ADD CONSTRAINT `matrices_course_guid_fkey` FOREIGN KEY (`course_guid`) REFERENCES `courses`(`guid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_DisciplineToMatrixModule` ADD CONSTRAINT `_DisciplineToMatrixModule_A_fkey` FOREIGN KEY (`A`) REFERENCES `disciplines`(`guid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_DisciplineToMatrixModule` ADD CONSTRAINT `_DisciplineToMatrixModule_B_fkey` FOREIGN KEY (`B`) REFERENCES `matrix_modules`(`guid`) ON DELETE CASCADE ON UPDATE CASCADE;
