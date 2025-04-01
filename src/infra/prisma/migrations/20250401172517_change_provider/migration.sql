-- CreateEnum
CREATE TYPE "Status" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "PeriodStatus" AS ENUM ('draft', 'notStarted', 'openForEnrollment', 'inProgress', 'finished', 'canceled');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');

-- CreateEnum
CREATE TYPE "RoleValue" AS ENUM ('principal', 'secretary', 'coordinator', 'educator');

-- CreateEnum
CREATE TYPE "ShiftValue" AS ENUM ('morning', 'afternoon', 'evening');

-- CreateEnum
CREATE TYPE "GradeItemType" AS ENUM ('sum', 'average');

-- CreateTable
CREATE TABLE "disciplines" (
    "guid" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'active',
    "name" VARCHAR(120) NOT NULL,
    "syllabus" VARCHAR(500) NOT NULL,
    "workload" INTEGER NOT NULL,
    "weekly_classes" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disciplines_pkey" PRIMARY KEY ("guid")
);

-- CreateTable
CREATE TABLE "courses" (
    "guid" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'active',
    "name" VARCHAR(120) NOT NULL,
    "minPassingGrade" DOUBLE PRECISION NOT NULL DEFAULT 6.0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("guid")
);

-- CreateTable
CREATE TABLE "matrix_modules" (
    "guid" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "matrix_guid" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matrix_modules_pkey" PRIMARY KEY ("guid")
);

-- CreateTable
CREATE TABLE "matrices" (
    "guid" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'active',
    "name" VARCHAR(120) NOT NULL,
    "course_guid" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matrices_pkey" PRIMARY KEY ("guid")
);

-- CreateTable
CREATE TABLE "roles" (
    "guid" TEXT NOT NULL,
    "role" "RoleValue" NOT NULL,
    "employee_guid" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("guid")
);

-- CreateTable
CREATE TABLE "addresses" (
    "guid" TEXT NOT NULL,
    "cep" VARCHAR(8) NOT NULL,
    "city" VARCHAR(120) NOT NULL,
    "state" VARCHAR(2) NOT NULL,
    "neighborhood" VARCHAR(120) NOT NULL,
    "street" VARCHAR(120) NOT NULL,
    "number" VARCHAR(10) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("guid")
);

-- CreateTable
CREATE TABLE "employees" (
    "guid" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'active',
    "name" VARCHAR(120) NOT NULL,
    "cpf" VARCHAR(11) NOT NULL,
    "birthdate" TIMESTAMP(3) NOT NULL,
    "phone_number" VARCHAR(11) NOT NULL,
    "email" VARCHAR(256) NOT NULL,
    "password" TEXT NOT NULL,
    "address_guid" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("guid")
);

-- CreateTable
CREATE TABLE "students" (
    "guid" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'active',
    "name" VARCHAR(120) NOT NULL,
    "cpf" VARCHAR(11) NOT NULL,
    "birthdate" TIMESTAMP(3) NOT NULL,
    "phone_number" VARCHAR(11) NOT NULL,
    "email" VARCHAR(256) NOT NULL,
    "password" TEXT NOT NULL,
    "address_guid" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("guid")
);

-- CreateTable
CREATE TABLE "classrooms" (
    "guid" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'active',
    "name" VARCHAR(120) NOT NULL,
    "capacity" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classrooms_pkey" PRIMARY KEY ("guid")
);

-- CreateTable
CREATE TABLE "shifts" (
    "guid" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'active',
    "shift" "ShiftValue" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shifts_pkey" PRIMARY KEY ("guid")
);

-- CreateTable
CREATE TABLE "class_schedules" (
    "guid" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'active',
    "class_number" INTEGER NOT NULL,
    "day_of_week" "DayOfWeek" NOT NULL,
    "shift_guid" TEXT NOT NULL,
    "start_time" TIME NOT NULL,
    "end_time" TIME NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "class_schedules_pkey" PRIMARY KEY ("guid")
);

-- CreateTable
CREATE TABLE "discipline_schedules" (
    "guid" TEXT NOT NULL,
    "employee_guid" TEXT NOT NULL,
    "period_guid" TEXT NOT NULL,
    "discipline_guid" TEXT NOT NULL,
    "classroom_guid" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discipline_schedules_pkey" PRIMARY KEY ("guid")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "guid" TEXT NOT NULL,
    "enrollment_number" VARCHAR(10) NOT NULL,
    "course_guid" TEXT NOT NULL,
    "student_guid" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("guid")
);

-- CreateTable
CREATE TABLE "periods" (
    "guid" TEXT NOT NULL,
    "status" "PeriodStatus" NOT NULL DEFAULT 'notStarted',
    "enrollment_start_date" TIMESTAMP(3),
    "enrollment_end_date" TIMESTAMP(3),
    "deadline" TIMESTAMP(3),
    "vacancies" INTEGER,
    "matrix_module_guid" TEXT NOT NULL,
    "class_id" TEXT,
    "classroom_guid" TEXT,
    "shift_guid" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "periods_pkey" PRIMARY KEY ("guid")
);

-- CreateTable
CREATE TABLE "student_absences" (
    "guid" TEXT NOT NULL,
    "total_presences" INTEGER NOT NULL DEFAULT 0,
    "total_absences" INTEGER NOT NULL,
    "student_guid" TEXT NOT NULL,
    "attendance_log_guid" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_absences_pkey" PRIMARY KEY ("guid")
);

-- CreateTable
CREATE TABLE "attendance_logs" (
    "guid" TEXT NOT NULL,
    "class_date" TIMESTAMP(3) NOT NULL,
    "class_summary" VARCHAR(1024) NOT NULL DEFAULT '',
    "total_classes" INTEGER NOT NULL,
    "period_guid" TEXT NOT NULL,
    "discipline_guid" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_logs_pkey" PRIMARY KEY ("guid")
);

-- CreateTable
CREATE TABLE "grade_items" (
    "guid" TEXT NOT NULL,
    "type" "GradeItemType" NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "max_value" DOUBLE PRECISION NOT NULL,
    "discipline_grade_config_guid" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grade_items_pkey" PRIMARY KEY ("guid")
);

-- CreateTable
CREATE TABLE "discipline_grade_configs" (
    "guid" TEXT NOT NULL,
    "period_guid" TEXT NOT NULL,
    "discipline_guid" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discipline_grade_configs_pkey" PRIMARY KEY ("guid")
);

-- CreateTable
CREATE TABLE "student_grade_items" (
    "guid" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "grade_item_guid" TEXT NOT NULL,
    "student_grade_guid" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_grade_items_pkey" PRIMARY KEY ("guid")
);

-- CreateTable
CREATE TABLE "student_grades" (
    "guid" TEXT NOT NULL,
    "final_value" DOUBLE PRECISION NOT NULL,
    "student_guid" TEXT NOT NULL,
    "discipline_guid" TEXT NOT NULL,
    "period_guid" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_grades_pkey" PRIMARY KEY ("guid")
);

-- CreateTable
CREATE TABLE "_DisciplineToMatrixModule" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_ClassScheduleToDisciplineSchedule" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_EnrollmentToPeriod" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "disciplines_name_key" ON "disciplines"("name");

-- CreateIndex
CREATE UNIQUE INDEX "courses_name_key" ON "courses"("name");

-- CreateIndex
CREATE UNIQUE INDEX "employees_cpf_key" ON "employees"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "employees_email_key" ON "employees"("email");

-- CreateIndex
CREATE UNIQUE INDEX "employees_address_guid_key" ON "employees"("address_guid");

-- CreateIndex
CREATE UNIQUE INDEX "students_cpf_key" ON "students"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "students_email_key" ON "students"("email");

-- CreateIndex
CREATE UNIQUE INDEX "students_address_guid_key" ON "students"("address_guid");

-- CreateIndex
CREATE UNIQUE INDEX "classrooms_name_key" ON "classrooms"("name");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_enrollment_number_key" ON "enrollments"("enrollment_number");

-- CreateIndex
CREATE UNIQUE INDEX "_DisciplineToMatrixModule_AB_unique" ON "_DisciplineToMatrixModule"("A", "B");

-- CreateIndex
CREATE INDEX "_DisciplineToMatrixModule_B_index" ON "_DisciplineToMatrixModule"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ClassScheduleToDisciplineSchedule_AB_unique" ON "_ClassScheduleToDisciplineSchedule"("A", "B");

-- CreateIndex
CREATE INDEX "_ClassScheduleToDisciplineSchedule_B_index" ON "_ClassScheduleToDisciplineSchedule"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_EnrollmentToPeriod_AB_unique" ON "_EnrollmentToPeriod"("A", "B");

-- CreateIndex
CREATE INDEX "_EnrollmentToPeriod_B_index" ON "_EnrollmentToPeriod"("B");

-- AddForeignKey
ALTER TABLE "matrix_modules" ADD CONSTRAINT "matrix_modules_matrix_guid_fkey" FOREIGN KEY ("matrix_guid") REFERENCES "matrices"("guid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matrices" ADD CONSTRAINT "matrices_course_guid_fkey" FOREIGN KEY ("course_guid") REFERENCES "courses"("guid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_employee_guid_fkey" FOREIGN KEY ("employee_guid") REFERENCES "employees"("guid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_address_guid_fkey" FOREIGN KEY ("address_guid") REFERENCES "addresses"("guid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_address_guid_fkey" FOREIGN KEY ("address_guid") REFERENCES "addresses"("guid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_schedules" ADD CONSTRAINT "class_schedules_shift_guid_fkey" FOREIGN KEY ("shift_guid") REFERENCES "shifts"("guid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discipline_schedules" ADD CONSTRAINT "discipline_schedules_employee_guid_fkey" FOREIGN KEY ("employee_guid") REFERENCES "employees"("guid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discipline_schedules" ADD CONSTRAINT "discipline_schedules_period_guid_fkey" FOREIGN KEY ("period_guid") REFERENCES "periods"("guid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discipline_schedules" ADD CONSTRAINT "discipline_schedules_discipline_guid_fkey" FOREIGN KEY ("discipline_guid") REFERENCES "disciplines"("guid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discipline_schedules" ADD CONSTRAINT "discipline_schedules_classroom_guid_fkey" FOREIGN KEY ("classroom_guid") REFERENCES "classrooms"("guid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_course_guid_fkey" FOREIGN KEY ("course_guid") REFERENCES "courses"("guid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_student_guid_fkey" FOREIGN KEY ("student_guid") REFERENCES "students"("guid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "periods" ADD CONSTRAINT "periods_matrix_module_guid_fkey" FOREIGN KEY ("matrix_module_guid") REFERENCES "matrix_modules"("guid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "periods" ADD CONSTRAINT "periods_classroom_guid_fkey" FOREIGN KEY ("classroom_guid") REFERENCES "classrooms"("guid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "periods" ADD CONSTRAINT "periods_shift_guid_fkey" FOREIGN KEY ("shift_guid") REFERENCES "shifts"("guid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_absences" ADD CONSTRAINT "student_absences_student_guid_fkey" FOREIGN KEY ("student_guid") REFERENCES "students"("guid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_absences" ADD CONSTRAINT "student_absences_attendance_log_guid_fkey" FOREIGN KEY ("attendance_log_guid") REFERENCES "attendance_logs"("guid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_logs" ADD CONSTRAINT "attendance_logs_period_guid_fkey" FOREIGN KEY ("period_guid") REFERENCES "periods"("guid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_logs" ADD CONSTRAINT "attendance_logs_discipline_guid_fkey" FOREIGN KEY ("discipline_guid") REFERENCES "disciplines"("guid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_items" ADD CONSTRAINT "grade_items_discipline_grade_config_guid_fkey" FOREIGN KEY ("discipline_grade_config_guid") REFERENCES "discipline_grade_configs"("guid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discipline_grade_configs" ADD CONSTRAINT "discipline_grade_configs_period_guid_fkey" FOREIGN KEY ("period_guid") REFERENCES "periods"("guid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discipline_grade_configs" ADD CONSTRAINT "discipline_grade_configs_discipline_guid_fkey" FOREIGN KEY ("discipline_guid") REFERENCES "disciplines"("guid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_grade_items" ADD CONSTRAINT "student_grade_items_grade_item_guid_fkey" FOREIGN KEY ("grade_item_guid") REFERENCES "grade_items"("guid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_grade_items" ADD CONSTRAINT "student_grade_items_student_grade_guid_fkey" FOREIGN KEY ("student_grade_guid") REFERENCES "student_grades"("guid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_grades" ADD CONSTRAINT "student_grades_student_guid_fkey" FOREIGN KEY ("student_guid") REFERENCES "students"("guid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_grades" ADD CONSTRAINT "student_grades_discipline_guid_fkey" FOREIGN KEY ("discipline_guid") REFERENCES "disciplines"("guid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_grades" ADD CONSTRAINT "student_grades_period_guid_fkey" FOREIGN KEY ("period_guid") REFERENCES "periods"("guid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DisciplineToMatrixModule" ADD CONSTRAINT "_DisciplineToMatrixModule_A_fkey" FOREIGN KEY ("A") REFERENCES "disciplines"("guid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DisciplineToMatrixModule" ADD CONSTRAINT "_DisciplineToMatrixModule_B_fkey" FOREIGN KEY ("B") REFERENCES "matrix_modules"("guid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClassScheduleToDisciplineSchedule" ADD CONSTRAINT "_ClassScheduleToDisciplineSchedule_A_fkey" FOREIGN KEY ("A") REFERENCES "class_schedules"("guid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClassScheduleToDisciplineSchedule" ADD CONSTRAINT "_ClassScheduleToDisciplineSchedule_B_fkey" FOREIGN KEY ("B") REFERENCES "discipline_schedules"("guid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EnrollmentToPeriod" ADD CONSTRAINT "_EnrollmentToPeriod_A_fkey" FOREIGN KEY ("A") REFERENCES "enrollments"("guid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EnrollmentToPeriod" ADD CONSTRAINT "_EnrollmentToPeriod_B_fkey" FOREIGN KEY ("B") REFERENCES "periods"("guid") ON DELETE CASCADE ON UPDATE CASCADE;
