import { FindAllArgs, IService } from '../interfaces';
import {
  CreatePeriodDTO,
  EmployeeRole,
  GenericStatus,
  UpdateEmployeeDTO,
} from '../models/dtos';
import { PeriodRepository } from '../models/repositories';

export class PeriodService implements IService {
  private periodRepository = new PeriodRepository();

  async create(data: CreatePeriodDTO) {
    const employee = await this.periodRepository.create(data);

    return employee;
  }

  async update(guid: string, data: UpdateEmployeeDTO) {
    const updatedEmployee = await this.periodRepository.update(guid, data);

    return updatedEmployee;
  }

  async changeStatus(guid: string, status: GenericStatus) {
    const updatedEmployee = await this.periodRepository.update(guid, {
      status,
    });

    return updatedEmployee;
  }

  async list(args?: FindAllArgs & { role?: EmployeeRole }) {
    const result = await this.periodRepository.findAll(args);

    return result;
  }
}
