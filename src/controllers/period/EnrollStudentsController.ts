import { Request, Response } from 'express';
import { PeriodService } from '../../services';

export class EnrollStudentsController {
  async handle(req: Request, res: Response) {
    const { guid } = req.params;
    const data = req.body as string[];

    const periodService = new PeriodService();

    const enrollments = await periodService.enrollStudents(guid, data);

    return res.json(enrollments);
  }
}
