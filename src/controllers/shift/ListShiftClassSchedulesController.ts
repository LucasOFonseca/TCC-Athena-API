import { Request, Response } from 'express';
import { ShiftService } from '../../services';

export class ListShiftClassSchedulesController {
  async handle(req: Request, res: Response) {
    const { shiftGuid } = req.params;
    const shiftService = new ShiftService();

    const result = await shiftService.listShiftClassSchedules(shiftGuid);

    if (result.length === 0) return res.status(204).send();

    return res.json(result);
  }
}
