import { FindAllArgs, IService } from '../interfaces';
import {
  CreateDisciplineDTO,
  GenericStatus,
  UpdateDisciplineDTO,
} from '../models/dtos';
import { DisciplineRepository } from '../models/repositories';

export class DisciplineService implements IService {
  private disciplineRepository = new DisciplineRepository();

  async create(data: CreateDisciplineDTO) {
    const discipline = await this.disciplineRepository.create(data);

    return discipline;
  }

  async update(guid: string, data: UpdateDisciplineDTO) {
    const updatedDiscipline = await this.disciplineRepository.update(
      guid,
      data
    );

    return updatedDiscipline;
  }

  async changeStatus(guid: string, status: GenericStatus) {
    const updatedDiscipline = await this.disciplineRepository.update(guid, {
      status,
    });

    return updatedDiscipline;
  }

  async list(args?: FindAllArgs) {
    const result = await this.disciplineRepository.findAll(args);

    return result;
  }
}
