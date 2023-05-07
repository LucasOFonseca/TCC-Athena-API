import { Request, Response } from 'express';
import { PaginatedResponse } from '../../helpers/utils';
import { EmployeeDTO } from '../../models/dtos';
import { EmployeeService } from '../../services';

export class ListEmployeesController {
  async handle(req: Request, res: Response) {
    const paginatedResponse = new PaginatedResponse<EmployeeDTO>(
      new EmployeeService()
    );

    const response = await paginatedResponse.get(req);

    return res.json(response);
  }
}
