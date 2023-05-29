import { Request, Response } from 'express';
import { AppError, ErrorMessages } from '../../infra/http/errors';
import { ShiftService } from '../../services';

export class ChangeShiftStatusController {
  async handle(req: Request, res: Response) {
    const { guid } = req.params;
    const { status } = req.body;

    const shiftService = new ShiftService();

    if (status === undefined) {
      throw new AppError(ErrorMessages.MSGE06);
    }

    const shift = await shiftService.changeStatus(guid, status);

    return res.json(shift);
  }
}
