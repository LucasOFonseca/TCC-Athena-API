import { generatePassword } from '../helpers/utils';
import { FindAllArgs, IService } from '../interfaces';
import {
  CreateStudentDTO,
  GenericStatus,
  UpdateStudentDTO,
} from '../models/dtos';
import { StudentRepository } from '../models/repositories';

export class StudentService implements IService {
  private studentRepository = new StudentRepository();

  async create(data: CreateStudentDTO) {
    const student = await this.studentRepository.create(data);

    return student;
  }

  async update(guid: string, data: UpdateStudentDTO) {
    const updatedStudent = await this.studentRepository.update(guid, data);

    return updatedStudent;
  }

  async changeStatus(guid: string, status: GenericStatus) {
    const updatedStudent = await this.studentRepository.update(guid, {
      status,
    });

    return updatedStudent;
  }

  async resetPassword(guid: string) {
    await this.studentRepository.update(guid, {
      password: generatePassword(),
    });
  }

  async list(args?: FindAllArgs) {
    const result = await this.studentRepository.findAll(args);

    return result;
  }
}
