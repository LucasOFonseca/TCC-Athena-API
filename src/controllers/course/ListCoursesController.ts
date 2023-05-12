import { Request, Response } from 'express';
import { PaginatedResponse } from '../../helpers/utils';
import { CourseDTO } from '../../models/dtos';
import { CourseService } from '../../services';

export class ListCoursesController {
  async handle(req: Request, res: Response) {
    const paginatedResponse = new PaginatedResponse<CourseDTO>(
      new CourseService()
    );

    const response = await paginatedResponse.get(req);

    return res.json(response);
  }
}
