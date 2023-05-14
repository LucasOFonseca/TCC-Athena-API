import { Request, Response } from 'express';
import { PaginatedResponse } from '../../helpers/utils';
import { ClassroomDTO } from '../../models/dtos';
import { ClassroomService } from '../../services';

export class ListClassroomsController {
  async handle(req: Request, res: Response) {
    const paginatedResponse = new PaginatedResponse<ClassroomDTO>(
      new ClassroomService()
    );

    const response = await paginatedResponse.get(req);

    return res.json(response);
  }
}
