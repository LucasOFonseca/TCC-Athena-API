import { Request, Response } from 'express';
import { ShiftService } from '../../services';

export class ListShiftsController {
  async handle(req: Request, res: Response) {
    const shiftService = new ShiftService();

    const shifts = await shiftService.list();

    return res.json(shifts);
  }
}
