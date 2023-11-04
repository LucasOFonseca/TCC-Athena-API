import { Request, Response } from 'express';
import { PeriodService } from '../../services';

export class GetStudentsGradesController {
  async handle(req: Request, res: Response) {
    const { periodGuid, disciplineGuid } = req.params;

    const periodService = new PeriodService();

    const grades = await periodService.getStudentsGrades(
      periodGuid,
      disciplineGuid
    );

    return res.json(grades);
  }
}
