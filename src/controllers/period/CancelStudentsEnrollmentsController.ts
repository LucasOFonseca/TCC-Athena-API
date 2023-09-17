import { Request, Response } from 'express';
import { PeriodService } from '../../services';

export class CancelStudentsEnrollmentsController {
  async handle(req: Request, res: Response) {
    const { guid } = req.params;
    const data = req.body as string[];

    const periodService = new PeriodService();

    await periodService.cancelStudentsEnrollments(guid, data);

    return res.status(202).send();
  }
}
