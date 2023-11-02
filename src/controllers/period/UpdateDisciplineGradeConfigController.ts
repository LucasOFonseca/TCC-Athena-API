import { Request, Response } from 'express';
import { DisciplineGradeConfigDTO } from '../../models/dtos';
import { PeriodService } from '../../services';

export class UpdateDisciplineGradeConfigController {
  async handle(req: Request, res: Response) {
    const { periodGuid, disciplineGuid } = req.params;
    const data = req.body as DisciplineGradeConfigDTO;

    const periodService = new PeriodService();

    const config = await periodService.updateDisciplineGradeConfig(
      periodGuid,
      disciplineGuid,
      data
    );

    return res.json(config);
  }
}
