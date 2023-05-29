import {
  CreateClassScheduleDTO,
  GenericStatus,
  UpdateClassScheduleDTO,
} from '../models/dtos';
import { ClassScheduleRepository } from '../models/repositories';

export class ClassScheduleService {
  private classScheduleRepository = new ClassScheduleRepository();

  async create(data: CreateClassScheduleDTO[]) {
    await this.classScheduleRepository.create(data);
  }

  async update(data: UpdateClassScheduleDTO[]) {
    await this.classScheduleRepository.update(data);
  }

  async changeStatus(guid: string, status: GenericStatus) {
    await this.classScheduleRepository.update([
      {
        guid,
        status,
      },
    ]);
  }
}
