import { Request, Response } from 'express';
import { PeriodService } from '../../services';

export class GetSimplifiedPeriodController {
  async handle(req: Request, res: Response) {
    const { guid } = req.params;

    const periodService = new PeriodService();

    const period = await periodService.findSimplifiedByGuid(guid);

    return res.json(period);
  }
}
