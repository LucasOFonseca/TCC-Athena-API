import { Router } from 'express';
import { authRoutes } from './auth.routes';
import { disciplineRoutes } from './discipline.routes';
import { employeeRoutes } from './employee.routes';

const router = Router();

router.use('/discipline', disciplineRoutes);
router.use('/employee', employeeRoutes);
router.use('/auth', authRoutes);

export { router };
