-- CreateTable
CREATE TABLE `disciplines` (
    `guid` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `syllabus` VARCHAR(500) NOT NULL,
    `workload` INTEGER NOT NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `disciplines_name_key`(`name`),
    PRIMARY KEY (`guid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
