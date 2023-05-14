import { Request, Response } from 'express';
import { AppError, ErrorMessages } from '../../infra/http/errors';
import { ClassroomService } from '../../services';

export class ChangeClassroomStatusController {
  async handle(req: Request, res: Response) {
    const { guid } = req.params;
    const { status } = req.body;

    const classroomService = new ClassroomService();

    if (status === undefined) {
      throw new AppError(ErrorMessages.MSGE06);
    }

    const classroom = await classroomService.changeStatus(guid, status);

    return res.json(classroom);
  }
}
