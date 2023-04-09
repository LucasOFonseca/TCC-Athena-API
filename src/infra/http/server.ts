import cors from 'cors';
import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import 'express-async-errors';
import { AppError } from './errors';
import { router } from './routers';

const app = express();

app.use(cors());
app.use(express.json());
app.use(router);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  res.removeHeader('successMessage');

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
  }

  return res.status(500).json({
    message: `Internal server error - ${err.message}`,
  });
});

app.listen(process.env.PORT, () => {
  console.log(
    `\n🚀 Server \x1b[32mstarted\x1b[0m on port \x1b[1m\x1b[36m${process.env.PORT}\x1b[0m`
  );
});
