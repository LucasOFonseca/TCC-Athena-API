import { Request, Response } from 'express';
import { EmployeeService } from '../../services';

export class ListEmployeeSchedulesController {
  async handle(req: Request, res: Response) {
    const { guid } = req.params;

    const employeeService = new EmployeeService();

    const schedules = await employeeService.listEmployeeSchedules(guid);

    return res.json(schedules);
  }
}
