import { Request, Response } from 'express';
import { StudentService } from '../../services';

export class GetStudentPeriodMatrixController {
  async handle(req: Request, res: Response) {
    const { periodGuid } = req.params;
    const { guid } = req.user;

    const studentService = new StudentService();

    const periodMatrix = await studentService.getStudentPeriodMatrix(
      guid,
      periodGuid
    );

    return res.json(periodMatrix);
  }
}
