import { Router } from 'express';
import { disciplineRoutes } from './discipline.routes';
import { employeeRoutes } from './employee.routes';

const router = Router();

router.use('/discipline', disciplineRoutes);
router.use('/employee', employeeRoutes);

export { router };
