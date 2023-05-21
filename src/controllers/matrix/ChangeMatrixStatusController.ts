import { Request, Response } from 'express';
import { AppError, ErrorMessages } from '../../infra/http/errors';
import { MatrixService } from '../../services';

export class ChangeMatrixStatusController {
  async handle(req: Request, res: Response) {
    const { guid } = req.params;
    const { status } = req.body;

    const matrixService = new MatrixService();

    if (status === undefined) {
      throw new AppError(ErrorMessages.MSGE06);
    }

    const matrix = await matrixService.changeStatus(guid, status);

    return res.json(matrix);
  }
}
