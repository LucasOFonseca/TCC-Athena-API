import { NextFunction, Request, Response } from 'express';
import { verify } from 'jsonwebtoken';
import { GenericStatus } from '../../../models/dtos';
import {
  EmployeeRepository,
  StudentRepository,
} from '../../../models/repositories';
import { AppError, ErrorMessages } from '../errors';

interface Payload {
  sub: string;
}

export async function ensureAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError(ErrorMessages.MSGE14, 401);
  }

  const [, token] = authHeader.split(' ');

  try {
    const { sub: guid } = verify(token, process.env.JWT_SECRET) as Payload;

    const employeeRepository = new EmployeeRepository();
    const studentRepository = new StudentRepository();

    let user = await employeeRepository.findByGuid(guid);

    if (!user) {
      user = { ...(await studentRepository.findByGuid(guid)), roles: [] };
    }

    if (user.status === GenericStatus.inactive) {
      throw new AppError(ErrorMessages.MSGE14, 401);
    }

    req.user = {
      guid,
      roles: user.roles,
    };

    next();
  } catch (e) {
    if (e instanceof Error || e instanceof AppError) throw e;

    throw new AppError(ErrorMessages.MSGE14, 401);
  }
}
