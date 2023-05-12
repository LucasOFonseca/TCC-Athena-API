import { Request, Response } from 'express';
import { AppError, ErrorMessages } from '../../infra/http/errors';
import { CourseService } from '../../services';

export class ChangeCourseStatusController {
  async handle(req: Request, res: Response) {
    const { guid } = req.params;
    const { status } = req.body;

    const courseService = new CourseService();

    if (status === undefined) {
      throw new AppError(ErrorMessages.MSGE06);
    }

    const course = await courseService.changeStatus(guid, status);

    return res.json(course);
  }
}
