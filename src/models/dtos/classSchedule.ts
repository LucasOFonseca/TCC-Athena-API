import { DayOfWeek, GenericStatus } from '.';

export interface CreateClassScheduleDTO {
  classNumber: number;
  shiftGuid: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
}

export interface ClassScheduleDTO extends CreateClassScheduleDTO {
  guid: string;
  status: GenericStatus;
}

export interface UpdateClassScheduleDTO {
  guid: string;
  status?: GenericStatus;
  shiftGuid?: string;
  classNumber?: number;
  dayOfWeek?: DayOfWeek;
  startTime?: string;
  endTime?: string;
}
