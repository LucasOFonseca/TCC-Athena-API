import { Request, Response } from 'express';
import { PeriodService } from '../../services';

export class CancelStudentsEnrollmentsController {
  async handle(req: Request, res: Response) {
    const { periodGuid, enrollmentGuid } = req.params;

    const periodService = new PeriodService();

    await periodService.cancelEnrollment(periodGuid, enrollmentGuid);

    return res.status(202).send();
  }
}
