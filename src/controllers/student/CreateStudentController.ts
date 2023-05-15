import { Request, Response } from 'express';
import { CreateStudentDTO } from '../../models/dtos';
import { StudentService } from '../../services';

export class CreateStudentController {
  async handle(req: Request, res: Response) {
    const data = req.body as CreateStudentDTO;

    const studentService = new StudentService();

    const student = await studentService.create(data);

    return res.status(201).json(student);
  }
}
