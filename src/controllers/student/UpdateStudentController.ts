import { Request, Response } from 'express';
import { UpdateStudentDTO } from '../../models/dtos';
import { StudentService } from '../../services';

export class UpdateStudentController {
  async handle(req: Request, res: Response) {
    const { guid } = req.params;
    const data = req.body as UpdateStudentDTO;

    const studentService = new StudentService();

    const student = await studentService.update(guid, data);

    return res.json(student);
  }
}
