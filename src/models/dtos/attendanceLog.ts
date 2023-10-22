export interface StudentAbsenceDTO {
  guid?: string;
  studentGuid: string;
  totalAbsences: number;
}

export interface CreateAttendanceLogDTO {
  periodGuid: string;
  disciplineGuid: string;
  classDate: string;
  totalClasses: number;
  studentAbsences: StudentAbsenceDTO[];
}

export interface UpdateAttendanceLogDTO {
  guid?: string;
  classDate?: string;
  totalClasses?: number;
  studentAbsences?: StudentAbsenceDTO[];
}

export interface SimplifiedAttendanceLogDTO {
  guid: string;
  classDate: string;
}
