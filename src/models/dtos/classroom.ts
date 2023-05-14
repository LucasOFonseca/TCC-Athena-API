import { GenericStatus } from './status';

export interface CreateClassroomDTO {
  name: string;
  capacity: number;
}

export interface ClassroomDTO extends CreateClassroomDTO {
  guid: string;
  status: GenericStatus;
}

export interface UpdateClassroomDTO {
  guid?: string;
  status?: GenericStatus;
  name?: string;
  capacity?: number;
}
