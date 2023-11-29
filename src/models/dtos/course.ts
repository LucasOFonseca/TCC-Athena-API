import { GenericStatus } from '.';

export interface CreateCourseDTO {
  name: string;
  minPassingGrade: number;
}

export interface CourseDTO extends CreateCourseDTO {
  guid: string;
  status: GenericStatus;
}

export interface UpdateCourseDTO {
  guid?: string;
  status?: GenericStatus;
  name?: string;
  minPassingGrade?: number;
}
