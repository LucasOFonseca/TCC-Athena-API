import { Request } from 'express';
import { AppError } from '../../infra/http/errors/AppError';
import { IService } from '../../interfaces';
import { GenericStatus, PaginatedDataResponseDTO } from '../../models/dtos';

export class PaginatedResponse<T> {
  constructor(private service: IService) {}

  async get(req: Request, extraArgs?: Record<string, string>) {
    if (req.query.page && isNaN(Number(req.query.page))) {
      throw new AppError('A página deve ser um número');
    }

    if (req.query.page && Number(req.query.page) < 1) {
      throw new AppError('A página deve ser maior que 0');
    }

    if (req.query.pageSize && isNaN(Number(req.query.pageSize))) {
      throw new AppError('O tamanho da página deve ser um número');
    }

    if (
      req.query.query &&
      typeof req.query.query === 'string' &&
      req.query.query.length < 3
    ) {
      throw new AppError(
        'O termo de busca deve conter pelo menos 3 caracteres'
      );
    }

    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 10;
    const page = req.query.page ? Number(req.query.page) : 1;
    const skip = (page - 1) * pageSize;

    const { data, totalItems } = await this.service.list({
      ...extraArgs,
      skip,
      take: pageSize,
      searchTerm: req.query.query as string,
      filterByStatus: req.query.filterByStatus as GenericStatus,
      itemsToExclude: [req.user.guid],
    });

    const response: PaginatedDataResponseDTO<T> = {
      data: data as T[],
      page,
      totalPages: Math.ceil(totalItems / pageSize),
      query: req.query.query as string,
      filterByStatus: req.query.filterByStatus as GenericStatus,
    };

    return response;
  }
}
