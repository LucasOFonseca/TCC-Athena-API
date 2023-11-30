import { Request, Response } from 'express';
import { EmployeeService } from '../../services';

export class ListEducatorSchedulesController {
  async handle(req: Request, res: Response) {
    const { guid } = req.user;

    const employeeService = new EmployeeService();

    const schedules = await employeeService.listEducatorSchedules(guid);

    return res.json(schedules);
  }
}
