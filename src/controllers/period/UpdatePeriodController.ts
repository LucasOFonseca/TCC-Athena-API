import { Request, Response } from 'express';
import { UpdatePeriodDTO } from '../../models/dtos';
import { PeriodService } from '../../services';

export class UpdatePeriodController {
  async handle(req: Request, res: Response) {
    const { guid } = req.params;
    const data = req.body as UpdatePeriodDTO;

    const periodService = new PeriodService();

    const period = await periodService.update(guid, data);

    return res.json(period);
  }
}
