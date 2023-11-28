import { Router } from 'express';
import {
  ChangeStudentStatusController,
  CreateStudentController,
  GetStudentPeriodDetailsController,
  GetStudentPeriodMatrixController,
  GetStudentSchedulesController,
  ListStudentAvailableCourseCertificatesController,
  ListStudentPeriodsController,
  ListStudentsController,
  ResetStudentPasswordController,
  UpdateStudentController,
} from '../../../controllers/student';

const studentRoutes = Router();

const createStudentController = new CreateStudentController();
const listStudentsController = new ListStudentsController();
const listStudentPeriodsController = new ListStudentPeriodsController();
const listStudentAvailableCourseCertificatesController =
  new ListStudentAvailableCourseCertificatesController();
const getStudentPeriodDetailsController =
  new GetStudentPeriodDetailsController();
const getStudentPeriodMatrixController = new GetStudentPeriodMatrixController();
const getStudentSchedulesController = new GetStudentSchedulesController();
const updateStudentController = new UpdateStudentController();
const resetStudentPasswordController = new ResetStudentPasswordController();
const changeStudentStatusController = new ChangeStudentStatusController();

studentRoutes.post('/', createStudentController.handle);
studentRoutes.get('/', listStudentsController.handle);
studentRoutes.get('/periods', listStudentPeriodsController.handle);
studentRoutes.get(
  '/available-certificates',
  listStudentAvailableCourseCertificatesController.handle
);
studentRoutes.get(
  '/periods/:periodGuid/details',
  getStudentPeriodDetailsController.handle
);
studentRoutes.get(
  '/periods/:periodGuid/matrix',
  getStudentPeriodMatrixController.handle
);
studentRoutes.get('/schedules', getStudentSchedulesController.handle);
studentRoutes.put('/:guid', updateStudentController.handle);
studentRoutes.put(
  '/:guid/reset-password',
  resetStudentPasswordController.handle
);
studentRoutes.patch('/:guid', changeStudentStatusController.handle);

export { studentRoutes };
