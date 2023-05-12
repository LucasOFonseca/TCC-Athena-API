import { Request, Response } from 'express';
import { CreateCourseDTO } from '../../models/dtos';
import { CourseService } from '../../services';

export class CreateCourseController {
  async handle(req: Request, res: Response) {
    const data = req.body as CreateCourseDTO;

    const courseService = new CourseService();

    const course = await courseService.create(data);

    return res.status(201).json(course);
  }
}
