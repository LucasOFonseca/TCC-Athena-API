import { NextFunction, Request, Response } from 'express';

export async function handleSuccessMessage(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (req.headers['success-message']) {
    res.setHeader('successMessage', req.headers['success-message']);
  }

  next();
}
