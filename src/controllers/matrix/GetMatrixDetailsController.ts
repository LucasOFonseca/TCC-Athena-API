import { Request, Response } from 'express';
import { MatrixService } from '../../services';

export class GetMatrixDetailsController {
  async handle(req: Request, res: Response) {
    const { guid } = req.params;

    const matrixService = new MatrixService();

    const matrix = await matrixService.findByGuid(guid);

    return res.json(matrix);
  }
}
