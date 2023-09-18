import { Request, Response } from 'express';
import { ClassroomService } from '../../services';

export class GetClassroomByGuidController {
  async handle(req: Request, res: Response) {
    const { guid } = req.params;

    const classroomService = new ClassroomService();

    const classroom = await classroomService.findByGuid(guid);

    return res.json(classroom);
  }
}
