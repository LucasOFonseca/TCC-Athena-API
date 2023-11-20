import { NextFunction, Request, Response } from 'express';
import { EmployeeRole } from '../../../models/dtos';
import { AppError, ErrorMessages } from '../errors';

export async function ensureManager(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { roles } = req.user;

  if (
    roles.length > 0 &&
    !roles.some(
      (role) =>
        role === EmployeeRole.principal ||
        role === EmployeeRole.coordinator ||
        role === EmployeeRole.secretary
    )
  ) {
    throw new AppError(ErrorMessages.MSGE14, 401);
  }

  next();
}
