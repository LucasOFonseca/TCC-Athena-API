export enum GradeItemType {
  sum = 'sum',
  average = 'average',
}

export interface GradeItemDTO {
  guid?: string;
  name: string;
  type: GradeItemType;
  maxValue: number;
}

export interface DisciplineGradeConfigDTO {
  guid?: string;
  gradeItems: GradeItemDTO[];
}
