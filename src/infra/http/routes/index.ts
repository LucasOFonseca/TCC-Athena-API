import { Router } from 'express';
import {
  ensureAuthenticated,
  ensureManager,
  ensurePrincipal,
} from '../middlewares';
import { authRoutes } from './auth.routes';
import { classroomRoutes } from './classroom.routes';
import { courseRoutes } from './course.routes';
import { disciplineRoutes } from './discipline.routes';
import { employeeRoutes } from './employee.routes';

const router = Router();

router.use('/discipline', ensureAuthenticated, ensureManager, disciplineRoutes);
router.use('/course', ensureAuthenticated, ensureManager, courseRoutes);
router.use('/classroom', ensureAuthenticated, ensureManager, classroomRoutes);
router.use('/employee', ensureAuthenticated, ensurePrincipal, employeeRoutes);
router.use('/auth', authRoutes);

export { router };
