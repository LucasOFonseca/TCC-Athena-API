import { Request, Response } from 'express';
import { PaginatedResponse } from '../../helpers/utils';
import { DisciplineDTO } from '../../models/dtos';
import { DisciplineService } from '../../services';

export class ListDisciplinesController {
  async handle(req: Request, res: Response) {
    const paginatedResponse = new PaginatedResponse<DisciplineDTO>(
      new DisciplineService()
    );

    const response = await paginatedResponse.get(req);

    return res.json(response);
  }
}
