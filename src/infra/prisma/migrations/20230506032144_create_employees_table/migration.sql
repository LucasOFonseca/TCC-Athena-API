/*
  Warnings:

  - You are about to drop the column `weeklyClasses` on the `disciplines` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `disciplines` DROP COLUMN `weeklyClasses`,
    ADD COLUMN `weekly_classes` INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE `roles` (
    `guid` VARCHAR(191) NOT NULL,
    `role` ENUM('principal', 'secretary', 'coordinator', 'educator') NOT NULL,
    `employee_guid` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`guid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `addresses` (
    `guid` VARCHAR(191) NOT NULL,
    `cep` VARCHAR(8) NOT NULL,
    `city` VARCHAR(120) NOT NULL,
    `state` VARCHAR(2) NOT NULL,
    `neighborhood` VARCHAR(120) NOT NULL,
    `street` VARCHAR(120) NOT NULL,
    `number` VARCHAR(10) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`guid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employees` (
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

    UNIQUE INDEX `employees_cpf_key`(`cpf`),
    UNIQUE INDEX `employees_email_key`(`email`),
    UNIQUE INDEX `employees_address_guid_key`(`address_guid`),
    PRIMARY KEY (`guid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `roles` ADD CONSTRAINT `roles_employee_guid_fkey` FOREIGN KEY (`employee_guid`) REFERENCES `employees`(`guid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employees` ADD CONSTRAINT `employees_address_guid_fkey` FOREIGN KEY (`address_guid`) REFERENCES `addresses`(`guid`) ON DELETE RESTRICT ON UPDATE CASCADE;
