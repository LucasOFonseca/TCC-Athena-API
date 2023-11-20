import { Request, Response } from 'express';
import { StudentService } from '../../services';

export class ListStudentPeriodsController {
  async handle(req: Request, res: Response) {
    const { guid } = req.user;

    const studentService = new StudentService();

    const periods = await studentService.listStudentPeriods(guid);

    return res.json(periods);
  }
}
