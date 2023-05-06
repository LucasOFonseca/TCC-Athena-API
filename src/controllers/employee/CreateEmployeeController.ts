import { Request, Response } from 'express';
import { CreateEmployeeDTO } from '../../models/dtos';
import { EmployeeService } from '../../services';

export class CreateEmployeeController {
  async handle(req: Request, res: Response) {
    const data = req.body as CreateEmployeeDTO;

    const employeeService = new EmployeeService();

    const employee = await employeeService.create(data);

    return res.status(201).json(employee);
  }
}
