import { Request, Response } from 'express';
import { StudentService } from '../../services';

export class ChangeStudentStatusController {
  async handle(req: Request, res: Response) {
    const { guid } = req.params;
    const { status } = req.body;

    const studentService = new StudentService();

    const student = await studentService.changeStatus(guid, status);

    return res.json(student);
  }
}
