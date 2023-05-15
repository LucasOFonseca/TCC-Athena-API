-- CreateTable
CREATE TABLE `students` (
    `guid` VARCHAR(191) NOT NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `name` VARCHAR(120) NOT NULL,
    `cpf` VARCHAR(11) NOT NULL,
    `birthdate` DATETIME(3) NOT NULL,
    `phone_number` VARCHAR(11) NOT NULL,
    `email` VARCHAR(256) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `address_guid` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `students_cpf_key`(`cpf`),
    UNIQUE INDEX `students_email_key`(`email`),
    UNIQUE INDEX `students_address_guid_key`(`address_guid`),
    PRIMARY KEY (`guid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_address_guid_fkey` FOREIGN KEY (`address_guid`) REFERENCES `addresses`(`guid`) ON DELETE RESTRICT ON UPDATE CASCADE;
