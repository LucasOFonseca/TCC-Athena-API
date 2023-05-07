import { Router } from 'express';
import {
  ChangeEmployeeStatusController,
  CreateEmployeeController,
  ListEmployeesController,
  ResetEmployeePasswordController,
  UpdateEmployeeController,
} from '../../../controllers/employee';

const employeeRoutes = Router();

const createEmployeeController = new CreateEmployeeController();
const listEmployeesController = new ListEmployeesController();
const updateEmployeeController = new UpdateEmployeeController();
const resetEmployeePasswordController = new ResetEmployeePasswordController();
const changeEmployeeStatusController = new ChangeEmployeeStatusController();

employeeRoutes.post('/', createEmployeeController.handle);
employeeRoutes.get('/', listEmployeesController.handle);
employeeRoutes.put('/:guid', updateEmployeeController.handle);
employeeRoutes.put(
  '/:guid/reset-password',
  resetEmployeePasswordController.handle
);
employeeRoutes.patch('/:guid', changeEmployeeStatusController.handle);

export { employeeRoutes };
