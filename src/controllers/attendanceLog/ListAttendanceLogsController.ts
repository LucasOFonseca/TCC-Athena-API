import { Request, Response } from 'express';
import { PaginatedResponse } from '../../helpers/utils';
import { IService } from '../../interfaces';
import { SimplifiedAttendanceLogDTO } from '../../models/dtos';
import { AttendanceLogService } from '../../services';

export class ListAttendanceLogsController {
  async handle(req: Request, res: Response) {
    const { periodGuid, disciplineGuid } = req.params;

    const paginatedResponse = new PaginatedResponse<SimplifiedAttendanceLogDTO>(
      new AttendanceLogService() as unknown as IService
    );

    const response = await paginatedResponse.get(req, {
      periodGuid,
      disciplineGuid,
    });

    return res.json(response);
  }
}
