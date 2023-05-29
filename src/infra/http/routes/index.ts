import { Router } from 'express';
import {
  ensureAuthenticated,
  ensureManager,
  ensurePrincipal,
} from '../middlewares';
import { authRoutes } from './auth.routes';
import { classroomRoutes } from './classroom.routes';
import { classScheduleRoutes } from './classSchedule.routes';
import { courseRoutes } from './course.routes';
import { disciplineRoutes } from './discipline.routes';
import { employeeRoutes } from './employee.routes';
import { matrixRoutes } from './matrix.routes';
import { shiftRoutes } from './shift.routes';
import { studentRoutes } from './student.routes';

const router = Router();

router.use('/discipline', ensureAuthenticated, ensureManager, disciplineRoutes);
router.use('/course', ensureAuthenticated, ensureManager, courseRoutes);
router.use('/classroom', ensureAuthenticated, ensureManager, classroomRoutes);
router.use('/student', ensureAuthenticated, ensureManager, studentRoutes);
router.use('/shift', ensureAuthenticated, ensureManager, shiftRoutes);
router.use(
  '/class-schedule',
  ensureAuthenticated,
  ensureManager,
  classScheduleRoutes
);
router.use('/employee', ensureAuthenticated, ensurePrincipal, employeeRoutes);
router.use('/matrix', ensureAuthenticated, ensurePrincipal, matrixRoutes);
router.use('/auth', authRoutes);

export { router };
