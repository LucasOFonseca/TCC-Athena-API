import { Request, Response } from 'express';
import { PeriodService } from '../../services';

export class ListPeriodEnrollmentsController {
  async handle(req: Request, res: Response) {
    const { guid } = req.params;

    const periodService = new PeriodService();

    const enrollments = await periodService.listPeriodEnrollments(guid);

    return res.json(enrollments);
  }
}
