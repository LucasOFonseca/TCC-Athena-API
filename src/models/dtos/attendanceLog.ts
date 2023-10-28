export interface StudentAbsenceDTO {
  guid?: string;
  studentGuid: string;
  studentName: string;
  totalPresences?: number;
  totalAbsences: number;
}

export interface CreateAttendanceLogDTO {
  periodGuid: string;
  disciplineGuid: string;
  classDate: string;
  totalClasses: number;
  classSummary: string;
  studentAbsences: StudentAbsenceDTO[];
}

export interface UpdateAttendanceLogDTO {
  guid?: string;
  classDate?: string;
  totalClasses?: number;
  classSummary?: string;
  studentAbsences?: StudentAbsenceDTO[];
}

export interface SimplifiedAttendanceLogDTO {
  guid: string;
  classDate: string;
  classSummary: string;
}
