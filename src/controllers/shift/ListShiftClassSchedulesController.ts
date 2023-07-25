import { Request, Response } from 'express';
import { AppError } from '../../infra/http/errors';
import { GenericStatus } from '../../models/dtos';
import { ShiftService } from '../../services';

export class ListShiftClassSchedulesController {
  async handle(req: Request, res: Response) {
    const { shiftGuid } = req.params;
    const shiftService = new ShiftService();

    const filterByStatus =
      typeof req.query.filterByStatus === 'string'
        ? req.query.filterByStatus
        : undefined;

    if (filterByStatus && !(filterByStatus in GenericStatus)) {
      throw new AppError(`${filterByStatus} não é um status válido`);
    }

    const result = await shiftService.listShiftClassSchedules(
      shiftGuid,
      filterByStatus as GenericStatus
    );

    if (result.length === 0) return res.status(204).send();

    return res.json(result);
  }
}
