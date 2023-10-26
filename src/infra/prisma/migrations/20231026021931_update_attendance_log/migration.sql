-- AlterTable
ALTER TABLE `attendance_logs` ADD COLUMN `class_summary` VARCHAR(1024) NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE `student_absences` ADD COLUMN `total_presences` INTEGER NOT NULL DEFAULT 0;
