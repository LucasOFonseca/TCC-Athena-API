import { Request, Response } from 'express';
import { EmployeeService } from '../../services';

export class ChangeEmployeeStatusController {
  async handle(req: Request, res: Response) {
    const { guid } = req.params;
    const { status } = req.body;

    const employeeService = new EmployeeService();

    const employee = await employeeService.changeStatus(guid, status);

    return res.json(employee);
  }
}
