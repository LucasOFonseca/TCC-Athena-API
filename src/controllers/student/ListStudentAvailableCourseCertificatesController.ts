import { Request, Response } from 'express';
import { StudentService } from '../../services';

export class ListStudentAvailableCourseCertificatesController {
  async handle(req: Request, res: Response) {
    const { guid } = req.user;

    const studentService = new StudentService();

    const availableCertificates =
      await studentService.getStudentAvailableCourseCertificates(guid);

    return res.json(availableCertificates);
  }
}
