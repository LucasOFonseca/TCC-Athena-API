import { Request, Response } from 'express';
import { StudentService } from '../../services';

export class GetStudentPeriodDetailsController {
  async handle(req: Request, res: Response) {
    const { periodGuid } = req.params;
    const { guid } = req.user;

    const studentService = new StudentService();

    const period = await studentService.getStudentPeriodDetails(
      guid,
      periodGuid
    );

    return res.json(period);
  }
}
