import { Request, Response } from 'express';
import { CourseDTO } from '../../models/dtos';
import { CourseService } from '../../services';

export class UpdateCourseController {
  async handle(req: Request, res: Response) {
    const { guid } = req.params;
    const data = req.body as CourseDTO;

    const courseService = new CourseService();

    const course = await courseService.update(guid, data);

    return res.json(course);
  }
}
