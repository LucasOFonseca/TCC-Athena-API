import { Request, Response } from 'express';
import { EmployeeService } from '../../services';

export class ListEmployeeDisciplinesByPeriodController {
  async handle(req: Request, res: Response) {
    const { employeeGuid, periodGuid } = req.params;

    const employeeService = new EmployeeService();

    const disciplines = await employeeService.listEmployeeDisciplinesByPeriod(
      employeeGuid,
      periodGuid
    );

    return res.json(disciplines);
  }
}
