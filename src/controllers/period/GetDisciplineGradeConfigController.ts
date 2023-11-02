import { Request, Response } from 'express';
import { PeriodService } from '../../services';

export class GetDisciplineGradeConfigController {
  async handle(req: Request, res: Response) {
    const { periodGuid, disciplineGuid } = req.params;

    const periodService = new PeriodService();

    const config = await periodService.getDisciplineGradeConfig(
      periodGuid,
      disciplineGuid
    );

    return res.json(config);
  }
}
