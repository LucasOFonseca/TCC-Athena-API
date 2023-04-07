import { Request, Response } from 'express';
import { CreateDisciplineDTO } from '../../models/dtos';
import { DisciplineService } from '../../services';

export class CreateDisciplineController {
  async handle(req: Request, res: Response) {
    const data = req.body as CreateDisciplineDTO;

    const disciplineService = new DisciplineService();

    const discipline = await disciplineService.create(data);

    return res.status(201).json(discipline);
  }
}
