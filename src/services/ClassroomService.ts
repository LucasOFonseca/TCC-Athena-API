import { FindAllArgs, IService } from '../interfaces';
import {
  CreateClassroomDTO,
  GenericStatus,
  UpdateClassroomDTO,
} from '../models/dtos';
import { ClassroomRepository } from '../models/repositories';

export class ClassroomService implements IService {
  private classroomRepository = new ClassroomRepository();

  async create(data: CreateClassroomDTO) {
    const classroom = await this.classroomRepository.create(data);

    return classroom;
  }

  async update(guid: string, data: UpdateClassroomDTO) {
    const updatedClassroom = await this.classroomRepository.update(guid, data);

    return updatedClassroom;
  }

  async changeStatus(guid: string, status: GenericStatus) {
    const updatedClassroom = await this.classroomRepository.update(guid, {
      status,
    });

    return updatedClassroom;
  }

  async list(args?: FindAllArgs) {
    const result = await this.classroomRepository.findAll(args);

    return result;
  }

  async findByGuid(guid: string) {
    const classroom = await this.classroomRepository.findByGuid(guid);

    return classroom;
  }
}
