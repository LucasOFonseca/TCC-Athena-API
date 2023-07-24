import { generatePassword } from '../helpers/utils';
import { FindAllArgs, IService } from '../interfaces';
import {
  CreateEmployeeDTO,
  EmployeeRole,
  GenericStatus,
  UpdateEmployeeDTO,
} from '../models/dtos';
import { EmployeeRepository } from '../models/repositories';

export class EmployeeService implements IService {
  private employeeRepository = new EmployeeRepository();

  async create(data: CreateEmployeeDTO) {
    const employee = await this.employeeRepository.create(data);

    return employee;
  }

  async update(guid: string, data: UpdateEmployeeDTO) {
    const updatedEmployee = await this.employeeRepository.update(guid, data);

    return updatedEmployee;
  }

  async changeStatus(guid: string, status: GenericStatus) {
    const updatedEmployee = await this.employeeRepository.update(guid, {
      status,
    });

    return updatedEmployee;
  }

  async resetPassword(guid: string) {
    await this.employeeRepository.update(guid, {
      password: generatePassword(),
    });
  }

  async list(args?: FindAllArgs & { role?: EmployeeRole }) {
    const result = await this.employeeRepository.findAll(args);

    return result;
  }
}
