import { Request, Response } from 'express';
import { MatrixDTO } from '../../models/dtos';
import { MatrixService } from '../../services';

export class UpdateMatrixController {
  async handle(req: Request, res: Response) {
    const { guid } = req.params;
    const data = req.body as MatrixDTO;

    const matrixService = new MatrixService();

    const matrix = await matrixService.update(guid, data);

    return res.json(matrix);
  }
}
