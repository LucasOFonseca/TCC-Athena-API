import { Request, Response } from 'express';
import { CreatePeriodDTO } from '../../models/dtos';
import { PeriodService } from '../../services';

export class CreatePeriodController {
  async handle(req: Request, res: Response) {
    const data = req.body as CreatePeriodDTO;

    const periodService = new PeriodService();

    const period = await periodService.create(data);

    return res.status(201).json(period);
  }
}
