import { Request, Response } from 'express';
import { UpdateAttendanceLogDTO } from '../../models/dtos';
import { AttendanceLogService } from '../../services';

export class UpdateAttendanceLogController {
  async handle(req: Request, res: Response) {
    const { guid } = req.params;
    const data = req.body as UpdateAttendanceLogDTO;

    const attendanceLogService = new AttendanceLogService();

    const attendanceLog = await attendanceLogService.update(guid, data);

    return res.json(attendanceLog);
  }
}
