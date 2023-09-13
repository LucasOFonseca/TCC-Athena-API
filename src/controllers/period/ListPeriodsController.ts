import { Request, Response } from 'express';
import { PaginatedResponse } from '../../helpers/utils';
import { AppError } from '../../infra/http/errors';
import { PeriodStatus, SimplifiedPeriodDTO } from '../../models/dtos';
import { PeriodService } from '../../services';

export class ListPeriodsController {
  async handle(req: Request, res: Response) {
    if (
      typeof req.query.filterByStatus === 'string' &&
      !(req.query.filterByStatus in PeriodStatus)
    ) {
      throw new AppError(`${req.query.filterByStatus} não é um status válido`);
    }

    const paginatedResponse = new PaginatedResponse<SimplifiedPeriodDTO>(
      new PeriodService()
    );

    const response = await paginatedResponse.get(req);

    return res.json(response);
  }
}
