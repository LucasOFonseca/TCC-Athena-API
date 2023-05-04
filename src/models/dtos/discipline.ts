import { GenericStatus } from './status';

export interface DisciplineDTO {
  guid: string;
  status: GenericStatus;
  name: string;
  syllabus: string;
  workload: number;
  weeklyClasses: number;
}

export interface CreateDisciplineDTO
  extends Omit<DisciplineDTO, 'guid' | 'status'> {}

export interface UpdateDisciplineDTO {
  guid?: string;
  status?: GenericStatus;
  name?: string;
  syllabus?: string;
  workload?: number;
  weeklyClasses?: number;
}
