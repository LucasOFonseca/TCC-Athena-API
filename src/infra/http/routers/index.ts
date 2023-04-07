import { Router } from 'express';
import { handleSuccessMessage } from '../middlewares';
import { disciplineRoutes } from './discipline.routes';

const router = Router();

router.all('*', handleSuccessMessage);

router.use('/discipline', disciplineRoutes);

export { router };
