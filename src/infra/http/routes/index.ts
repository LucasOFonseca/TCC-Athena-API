import { Router } from 'express';
import { disciplineRoutes } from './discipline.routes';

const router = Router();

router.use('/discipline', disciplineRoutes);

export { router };
