import { Request, Response } from 'express';
import { UpdateClassScheduleDTO } from '../../models/dtos';
import { ClassScheduleService } from '../../services';

export class UpdateClassSchedulesController {
  async handle(req: Request, res: Response) {
    const data = req.body as UpdateClassScheduleDTO[];

    const classScheduleService = new ClassScheduleService();

    await classScheduleService.update(data);

    return res.status(202).send();
  }
}
