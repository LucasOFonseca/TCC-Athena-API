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

  async listStudentPeriods(guid: string) {
    const result = await this.studentRepository.findStudentPeriods(guid);

    return result;
  }

  async getStudentPeriodDetails(studentGuid: string, periodGuid: string) {
    const result = await this.studentRepository.findStudentPeriodDetails(
      studentGuid,
      periodGuid
    );

    return result;
  }

  async getStudentPeriodMatrix(studentGuid: string, periodGuid: string) {
    const result = await this.studentRepository.findStudentPeriodMatrix(
      studentGuid,
      periodGuid
    );

    return result;
  }

  async getStudentAvailableCourseCertificates(guid: string) {
    const result =
      await this.studentRepository.findStudentAvailableCourseCertificates(guid);

    return result;
  }

  async getStudentSchedules(guid: string) {
    const result = await this.studentRepository.findStudentSchedules(guid);

    return result;
  }
}
