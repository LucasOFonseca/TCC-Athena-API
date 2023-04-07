import { Request, Response } from 'express';
import { AppError, ErrorMessages } from '../../infra/http/errors';
import { DisciplineService } from '../../services';

export class ChangeDisciplineStatusController {
  async handle(req: Request, res: Response) {
    const { guid } = req.params;
    const { status } = req.body;

    const disciplineService = new DisciplineService();

    if (status === undefined) {
      throw new AppError(ErrorMessages.invalidData);
    }

    const discipline = await disciplineService.changeStatus(guid, status);

    return res.json(discipline);
  }
}
