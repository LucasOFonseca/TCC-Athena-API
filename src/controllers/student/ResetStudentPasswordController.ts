import { Request, Response } from 'express';
import { StudentService } from '../../services';

export class ResetStudentPasswordController {
  async handle(req: Request, res: Response) {
    const { guid } = req.params;

    const studentService = new StudentService();

    await studentService.resetPassword(guid);

    return res.status(202).send();
  }
}
