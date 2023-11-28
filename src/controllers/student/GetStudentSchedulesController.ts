import { Request, Response } from 'express';
import { StudentService } from '../../services';

export class GetStudentSchedulesController {
  async handle(req: Request, res: Response) {
    const { guid } = req.user;

    const studentService = new StudentService();

    const schedules = await studentService.getStudentSchedules(guid);

    return res.json(schedules);
  }
}
