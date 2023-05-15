import { Router } from 'express';
import {
  ChangeStudentStatusController,
  CreateStudentController,
  ListStudentsController,
  ResetStudentPasswordController,
  UpdateStudentController,
} from '../../../controllers/student';

const studentRoutes = Router();

const createStudentController = new CreateStudentController();
const listStudentsController = new ListStudentsController();
const updateStudentController = new UpdateStudentController();
const resetStudentPasswordController = new ResetStudentPasswordController();
const changeStudentStatusController = new ChangeStudentStatusController();

studentRoutes.post('/', createStudentController.handle);
studentRoutes.get('/', listStudentsController.handle);
studentRoutes.put('/:guid', updateStudentController.handle);
studentRoutes.put(
  '/:guid/reset-password',
  resetStudentPasswordController.handle
);
studentRoutes.patch('/:guid', changeStudentStatusController.handle);

export { studentRoutes };
