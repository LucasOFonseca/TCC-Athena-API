import { Request, Response } from 'express';
import { EmployeeService } from '../../services';

export class ListEmployeeDisciplinesByPeriodController {
  async handle(req: Request, res: Response) {
    const { guid } = req.user;
    const { periodGuid } = req.params;

    const employeeService = new EmployeeService();

    const disciplines = await employeeService.listEmployeeDisciplinesByPeriod(
      guid,
      periodGuid
    );

    return res.json(disciplines);
  }
}
