import { Request, Response } from 'express';
import { EmployeeService } from '../../services';

export class ResetEmployeePasswordController {
  async handle(req: Request, res: Response) {
    const { guid } = req.params;

    const employeeService = new EmployeeService();

    await employeeService.resetPassword(guid);

    return res.status(202).send();
  }
}
