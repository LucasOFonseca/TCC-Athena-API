import { Request, Response } from 'express';
import { PaginatedResponse } from '../../helpers/utils';
import { AppError, ErrorMessages } from '../../infra/http/errors';
import { EmployeeDTO, EmployeeRole } from '../../models/dtos';
import { EmployeeService } from '../../services';

export class ListEmployeesController {
  async handle(req: Request, res: Response) {
    const paginatedResponse = new PaginatedResponse<EmployeeDTO>(
      new EmployeeService()
    );

    const role =
      typeof req.query.role === 'string' ? req.query.role : undefined;

    if (role && !(role in EmployeeRole)) {
      throw new AppError(ErrorMessages.MSGE06);
    }

    const response = await paginatedResponse.get(req, { role });

    return res.json(response);
  }
}
