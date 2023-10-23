import { Request, Response } from 'express';
import { EmployeeService } from '../../services';

export class ListEmployeePeriodsController {
  async handle(req: Request, res: Response) {
    const { guid } = req.params;

    const employeeService = new EmployeeService();

    const periods = await employeeService.listEmployeePeriods(guid);

    return res.json(periods);
  }
}
