import { Request, Response } from 'express';
import { CreateClassroomDTO } from '../../models/dtos';
import { ClassroomService } from '../../services';

export class CreateClassroomController {
  async handle(req: Request, res: Response) {
    const data = req.body as CreateClassroomDTO;

    const classroomService = new ClassroomService();

    const classroom = await classroomService.create(data);

    return res.status(201).json(classroom);
  }
}
