import { Router } from 'express';
import {
  CancelPeriodController,
  CancelStudentsEnrollmentsController,
  CreatePeriodController,
  EnrollStudentsController,
  GetPeriodDetailsController,
  ListPeriodsController,
  UpdatePeriodController,
} from '../../../controllers/period';

const periodRoutes = Router();

const createPeriodController = new CreatePeriodController();
const listPeriodsController = new ListPeriodsController();
const updatePeriodController = new UpdatePeriodController();
const getPeriodDetailsController = new GetPeriodDetailsController();
const cancelPeriodController = new CancelPeriodController();
const enrollStudentsController = new EnrollStudentsController();
const cancelStudentsEnrollmentsController =
  new CancelStudentsEnrollmentsController();

periodRoutes.post('/', createPeriodController.handle);
periodRoutes.get('/', listPeriodsController.handle);
periodRoutes.get('/:guid', getPeriodDetailsController.handle);
periodRoutes.put('/:guid', updatePeriodController.handle);
periodRoutes.patch('/:guid/cancel', cancelPeriodController.handle);
periodRoutes.post('/:guid/enroll', enrollStudentsController.handle);
periodRoutes.delete(
  '/:periodGuid/enrollments/:enrollmentGuid',
  cancelStudentsEnrollmentsController.handle
);

export { periodRoutes };
