import { GenericStatus } from './status';

export interface CreateDisciplineDTO {
  name: string;
  syllabus: string;
  workload: number;
  weeklyClasses: number;
}

export interface DisciplineDTO extends CreateDisciplineDTO {
  guid: string;
  status: GenericStatus;
}

export interface UpdateDisciplineDTO {
  guid?: string;
  status?: GenericStatus;
  name?: string;
  syllabus?: string;
  workload?: number;
  weeklyClasses?: number;
}
