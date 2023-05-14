import { Request, Response } from 'express';
import { ClassroomDTO } from '../../models/dtos';
import { ClassroomService } from '../../services';

export class UpdateClassroomController {
  async handle(req: Request, res: Response) {
    const { guid } = req.params;
    const data = req.body as ClassroomDTO;

    const classroomService = new ClassroomService();

    const classroom = await classroomService.update(guid, data);

    return res.json(classroom);
  }
}
