import { IService } from '../interfaces';
import {
  CreatePeriodDTO,
  DisciplineGradeConfigDTO,
  PeriodStatus,
  StudentGradeDTO,
  UpdatePeriodDTO,
} from '../models/dtos';
import { FindAllPeriodsArgs, PeriodRepository } from '../models/repositories';

export class PeriodService implements IService {
  private periodRepository = new PeriodRepository();

  async create(data: CreatePeriodDTO) {
    const period = await this.periodRepository.create(data);

    return period;
  }

  async update(guid: string, data: UpdatePeriodDTO) {
    const updatedPeriod = await this.periodRepository.update(guid, data);

    return updatedPeriod;
  }

  async changeStatus(guid: string) {
    const updatedPeriod = await this.periodRepository.update(guid, {
      status: PeriodStatus.canceled,
    });

    return updatedPeriod;
  }

  async list(args?: FindAllPeriodsArgs) {
    const result = await this.periodRepository.findAll(args);

    return result;
  }

  async findByGuid(guid: string) {
    const period = await this.periodRepository.findByGuid(guid);

    return period;
  }

  async findSimplifiedByGuid(guid: string) {
    const period = await this.periodRepository.findSimplifiedByGuid(guid);

    return period;
  }

  async enrollStudents(guid: string, studentsGuidList: string[]) {
    const result = await this.periodRepository.enrollStudents(
      guid,
      studentsGuidList
    );

    return result;
  }

  async listPeriodEnrollments(guid: string) {
    const result = await this.periodRepository.findPeriodEnrollments(guid);

    return result;
  }

  async cancelEnrollment(periodGuid: string, enrollmentGuid: string) {
    await this.periodRepository.cancelEnrollment(periodGuid, enrollmentGuid);
  }

  async updateDisciplineGradeConfig(
    periodGuid: string,
    disciplineGuid: string,
    data: DisciplineGradeConfigDTO
  ) {
    const config = await this.periodRepository.updateDisciplineGradeConfig(
      periodGuid,
      disciplineGuid,
      data
    );

    return config;
  }

  async getDisciplineGradeConfig(periodGuid: string, disciplineGuid: string) {
    const config = await this.periodRepository.findDisciplineGradeConfig(
      periodGuid,
      disciplineGuid
    );

    return config;
  }

  async updateStudentsGrades(
    periodGuid: string,
    disciplineGuid: string,
    data: StudentGradeDTO[]
  ) {
    const grades = await this.periodRepository.updateStudentsGrades(
      periodGuid,
      disciplineGuid,
      data
    );

    return grades;
  }

  async getStudentsGrades(periodGuid: string, disciplineGuid: string) {
    const grades = await this.periodRepository.findStudentsGrades(
      periodGuid,
      disciplineGuid
    );

    return grades;
  }
}
