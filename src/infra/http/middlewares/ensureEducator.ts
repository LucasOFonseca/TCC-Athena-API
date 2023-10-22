import { NextFunction, Request, Response } from 'express';
import { EmployeeRole } from '../../../models/dtos';
import { AppError, ErrorMessages } from '../errors';

export async function ensureEducator(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { roles } = req.user;

  if (!roles.includes(EmployeeRole.educator)) {
    throw new AppError(ErrorMessages.MSGE14, 403);
  }

  next();
}
