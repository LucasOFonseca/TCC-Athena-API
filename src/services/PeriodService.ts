import { FindAllArgs, IService } from '../interfaces';
import {
  CreatePeriodDTO,
  EmployeeRole,
  GenericStatus,
  UpdatePeriodDTO,
} from '../models/dtos';
import { PeriodRepository } from '../models/repositories';

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
