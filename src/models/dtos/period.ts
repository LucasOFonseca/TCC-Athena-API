import { ClassScheduleDTO, PeriodStatus } from '.';

export interface DisciplineScheduleDTO {
  guid?: string;
  employeeGuid: string;
  disciplineGuid: string;
  schedules: ClassScheduleDTO[];
}

export interface CreatePeriodDTO {
  status?: PeriodStatus;
  enrollmentStartDate?: string;
  enrollmentEndDate?: string;
  deadline?: string;
  vacancies?: number;
  classroomGuid?: string;
  shiftGuid?: string;
  matrixModuleGuid: string;
  classId?: string;
  disciplinesSchedule?: DisciplineScheduleDTO[];
}

export interface UpdatePeriodDTO {
  guid?: string;
  status?: PeriodStatus;
  enrollmentStartDate?: string;
  enrollmentEndDate?: string;
  deadline?: string;
  vacancies?: number;
  classroomGuid?: string;
  shiftGuid?: string;
  classId?: string;
  disciplinesSchedule?: DisciplineScheduleDTO[];
}

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
