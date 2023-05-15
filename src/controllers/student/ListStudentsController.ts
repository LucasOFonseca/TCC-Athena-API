import { Request, Response } from 'express';
import { PaginatedResponse } from '../../helpers/utils';
import { StudentDTO } from '../../models/dtos';
import { StudentService } from '../../services';

export class ListStudentsController {
  async handle(req: Request, res: Response) {
    const paginatedResponse = new PaginatedResponse<StudentDTO>(
      new StudentService()
    );

    const response = await paginatedResponse.get(req);

    return res.json(response);
  }
}
