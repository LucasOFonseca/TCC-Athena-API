import { Request, Response } from 'express';
import { AttendanceLogService } from '../../services';

export class GetAttendanceLogDetailsController {
  async handle(req: Request, res: Response) {
    const { guid } = req.params;

    const attendanceLogService = new AttendanceLogService();

    const attendanceLog = await attendanceLogService.findByGuid(guid);

    return res.json(attendanceLog);
  }
}
