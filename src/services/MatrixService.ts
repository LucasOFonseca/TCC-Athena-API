import { excludeFields } from '../helpers/utils';
import { FindAllArgs, FindAllReturn, IService } from '../interfaces';
import {
  CreateMatrixDTO,
  GenericStatus,
  MatrixBaseDTO,
  UpdateMatrixDTO,
} from '../models/dtos';
import { MatrixRepository } from '../models/repositories';

export class MatrixService implements IService {
  matrixRepository = new MatrixRepository();

  async create(data: CreateMatrixDTO) {
    const matrix = await this.matrixRepository.create(data);

    return matrix;
  }

  async update(guid: string, data: UpdateMatrixDTO) {
    const updatedMatrix = await this.matrixRepository.update(guid, data);

    return excludeFields(updatedMatrix, ['courseName']);
  }

  async changeStatus(
    guid: string,
    status: GenericStatus
  ): Promise<MatrixBaseDTO> {
    const { name, courseName } = await this.matrixRepository.update(guid, {
      status,
    });

    return {
      guid,
      status,
      name: `${courseName} - ${name}`,
    };
  }

  async list(args?: FindAllArgs): Promise<FindAllReturn> {
    const result = await this.matrixRepository.findAll(args);

    return result;
  }

  async findByGuid(guid: string) {
    const matrix = await this.matrixRepository.findByGuid(guid);

    return matrix;
  }
}
