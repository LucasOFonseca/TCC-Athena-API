import { Request, Response } from 'express';
import { DisciplineDTO } from '../../models/dtos';
import { DisciplineService } from '../../services';

export class UpdateDisciplineController {
  async handle(req: Request, res: Response) {
    const { guid } = req.params;
    const data = req.body as DisciplineDTO;

    const disciplineService = new DisciplineService();

    const discipline = await disciplineService.update(guid, data);

    return res.json(discipline);
  }
}
