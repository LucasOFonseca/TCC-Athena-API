import { Request, Response } from 'express';
import { CreateClassScheduleDTO } from '../../models/dtos';
import { ClassScheduleService } from '../../services';

export class CreateClassSchedulesController {
  async handle(req: Request, res: Response) {
    const data = req.body as CreateClassScheduleDTO[];

    const classScheduleService = new ClassScheduleService();

    await classScheduleService.create(data);

    return res.status(201).send();
  }
}
