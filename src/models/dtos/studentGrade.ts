export interface StudentGradeItem {
  guid?: string;
  gradeItemGuid: string;
  name?: string;
  value: number;
}

interface StudentGradeBase {
  studentGuid: string;
  gradeItems: StudentGradeItem[];
}

export interface CreateStudentGradeDTO extends StudentGradeBase {
  periodGuid: string;
  disciplineGuid: string;
}

export interface UpdateStudentGradeDTO extends StudentGradeBase {
  guid: string;
}

export interface StudentGradeDTO extends UpdateStudentGradeDTO {
  finalValue: number;
}
