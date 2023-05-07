import { Request, Response } from 'express';
import { UpdateEmployeeDTO } from '../../models/dtos';
import { EmployeeService } from '../../services';

export class UpdateEmployeeController {
  async handle(req: Request, res: Response) {
    const { guid } = req.params;
    const data = req.body as UpdateEmployeeDTO;

    const employeeService = new EmployeeService();

    const employee = await employeeService.update(guid, data);

    return res.json(employee);
  }
}
