import { ClassScheduleDTO, PeriodStatus } from '.';

export interface DisciplineScheduleDTO {
  guid?: string;
  employeeGuid: string;
  employeeName: string;
  disciplineGuid: string;
  disciplineName: string;
  schedules: ClassScheduleDTO[];
}

export interface PeriodDTO {
  guid: string;
  status: PeriodStatus;
  matrixGuid: string;
  matrixModuleGuid: string;
  enrollmentStartDate?: string;
  enrollmentEndDate?: string;
  deadline?: string;
  vacancies?: number;
  classroomGuid?: string;
  shiftGuid?: string;
  classId?: string;
  disciplinesSchedule?: DisciplineScheduleDTO[];
}

export interface CreatePeriodDTO
  extends Omit<PeriodDTO, 'guid' | 'status' | 'matrixGuid'> {
  status?: PeriodStatus;
}

export type UpdatePeriodDTO = Partial<
  Omit<PeriodDTO, 'matrixModuleGuid' | 'matrixGuid'>
>;

export interface SimplifiedDisciplineScheduleDTO {
  guid: string;
  name: string;
  educator: string;
  schedules: ClassScheduleDTO[];
}

export interface SimplifiedPeriodDTO {
  guid: string;
  status: PeriodStatus;
  name: string;
  enrollmentStartDate?: string;
  disciplinesSchedule?: SimplifiedDisciplineScheduleDTO[];
}
