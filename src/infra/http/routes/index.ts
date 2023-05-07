import { Router } from 'express';
import {
  ensureAuthenticated,
  ensureManager,
  ensurePrincipal,
} from '../middlewares';
import { authRoutes } from './auth.routes';
import { disciplineRoutes } from './discipline.routes';
import { employeeRoutes } from './employee.routes';

const router = Router();

router.use('/discipline', ensureAuthenticated, ensureManager, disciplineRoutes);
router.use('/employee', ensureAuthenticated, ensurePrincipal, employeeRoutes);
router.use('/auth', authRoutes);

export { router };
