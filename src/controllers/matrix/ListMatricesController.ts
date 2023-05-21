import { Request, Response } from 'express';
import { PaginatedResponse } from '../../helpers/utils';
import { MatrixDTO } from '../../models/dtos';
import { MatrixService } from '../../services';

export class ListMatricesController {
  async handle(req: Request, res: Response) {
    const paginatedResponse = new PaginatedResponse<MatrixDTO>(
      new MatrixService()
    );

    const response = await paginatedResponse.get(req);

    return res.json(response);
  }
}
