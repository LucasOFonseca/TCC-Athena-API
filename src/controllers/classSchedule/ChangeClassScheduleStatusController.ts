import { Request, Response } from 'express';
import { AppError, ErrorMessages } from '../../infra/http/errors';
import { ClassScheduleService } from '../../services';

export class ChangeClassScheduleStatusController {
  async handle(req: Request, res: Response) {
    const { guid } = req.params;
    const { status } = req.body;

    const classScheduleService = new ClassScheduleService();

    if (status === undefined) {
      throw new AppError(ErrorMessages.MSGE06);
    }

    await classScheduleService.changeStatus(guid, status);

    return res.status(202).send();
  }
}
