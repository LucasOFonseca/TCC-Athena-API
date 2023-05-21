import { Request, Response } from 'express';
import { CreateMatrixDTO } from '../../models/dtos';
import { MatrixService } from '../../services';

export class CreateMatrixController {
  async handle(req: Request, res: Response) {
    const data = req.body as CreateMatrixDTO;

    const matrixService = new MatrixService();

    const matrix = await matrixService.create(data);

    return res.status(201).json(matrix);
  }
}
