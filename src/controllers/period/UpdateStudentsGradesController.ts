import { Request, Response } from 'express';
import { StudentGradeDTO } from '../../models/dtos';
import { PeriodService } from '../../services';

export class UpdateStudentsGradesController {
  async handle(req: Request, res: Response) {
    const { periodGuid, disciplineGuid } = req.params;
    const data = req.body as StudentGradeDTO[];

    const periodService = new PeriodService();

    const grades = await periodService.updateStudentsGrades(
      periodGuid,
      disciplineGuid,
      data
    );

    return res.json(grades);
  }
}
