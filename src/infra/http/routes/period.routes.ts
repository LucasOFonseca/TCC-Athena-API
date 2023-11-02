import { Router } from 'express';
import {
  CancelPeriodController,
  CancelStudentsEnrollmentsController,
  CreatePeriodController,
  EnrollStudentsController,
  GetDisciplineGradeConfigController,
  GetPeriodDetailsController,
  ListPeriodEnrollmentsController,
  ListPeriodsController,
  UpdateDisciplineGradeConfigController,
  UpdatePeriodController,
} from '../../../controllers/period';

const periodRoutes = Router();

const createPeriodController = new CreatePeriodController();
const listPeriodsController = new ListPeriodsController();
const updatePeriodController = new UpdatePeriodController();
const getPeriodDetailsController = new GetPeriodDetailsController();
const cancelPeriodController = new CancelPeriodController();
const enrollStudentsController = new EnrollStudentsController();
const listPeriodEnrollments = new ListPeriodEnrollmentsController();
const cancelStudentsEnrollmentsController =
  new CancelStudentsEnrollmentsController();
const updateDisciplineGradeConfigController =
  new UpdateDisciplineGradeConfigController();
const getDisciplineGradeConfigController =
  new GetDisciplineGradeConfigController();

periodRoutes.post('/', createPeriodController.handle);
periodRoutes.get('/', listPeriodsController.handle);
periodRoutes.get('/:guid', getPeriodDetailsController.handle);
periodRoutes.put('/:guid', updatePeriodController.handle);
periodRoutes.patch('/:guid/cancel', cancelPeriodController.handle);
periodRoutes.post('/:guid/enroll', enrollStudentsController.handle);
periodRoutes.get('/:guid/enrollments', listPeriodEnrollments.handle);
periodRoutes.delete(
  '/:periodGuid/enrollments/:enrollmentGuid',
  cancelStudentsEnrollmentsController.handle
);
periodRoutes.put(
  '/:periodGuid/disciplines/:disciplineGuid/grade-config',
  updateDisciplineGradeConfigController.handle
);
periodRoutes.get(
  '/:periodGuid/disciplines/:disciplineGuid/grade-config',
  getDisciplineGradeConfigController.handle
);

export { periodRoutes };
