import { Request, Response } from 'express';
import { CreateAttendanceLogDTO } from '../../models/dtos';
import { AttendanceLogService } from '../../services';

export class CreateAttendanceLogController {
  async handle(req: Request, res: Response) {
    const data = req.body as CreateAttendanceLogDTO;

    const attendanceLogService = new AttendanceLogService();

    const attendanceLog = await attendanceLogService.create(data);

    return res.status(201).json(attendanceLog);
  }
}
