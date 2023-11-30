import { Router } from 'express';
import {
  ChangeEmployeeStatusController,
  CreateEmployeeController,
  ListEducatorSchedulesController,
  ListEmployeeDisciplinesByPeriodController,
  ListEmployeePeriodsController,
  ListEmployeeSchedulesController,
  ListEmployeesController,
  ResetEmployeePasswordController,
  UpdateEmployeeController,
} from '../../../controllers/employee';

const employeeRoutes = Router();

const createEmployeeController = new CreateEmployeeController();
const listEmployeesController = new ListEmployeesController();
const listEmployeeSchedulesController = new ListEmployeeSchedulesController();
const listEducatorSchedulesController = new ListEducatorSchedulesController();
const listEmployeePeriodsController = new ListEmployeePeriodsController();
const listEmployeeDisciplinesByPeriodController =
  new ListEmployeeDisciplinesByPeriodController();
const updateEmployeeController = new UpdateEmployeeController();
const resetEmployeePasswordController = new ResetEmployeePasswordController();
const changeEmployeeStatusController = new ChangeEmployeeStatusController();

employeeRoutes.post('/', createEmployeeController.handle);
employeeRoutes.get('/', listEmployeesController.handle);
employeeRoutes.get('/:guid/schedules', listEmployeeSchedulesController.handle);
employeeRoutes.get(
  '/:guid/educator/schedules',
  listEducatorSchedulesController.handle
);
employeeRoutes.get('/periods', listEmployeePeriodsController.handle);
employeeRoutes.get(
  '/periods/:periodGuid/disciplines',
  listEmployeeDisciplinesByPeriodController.handle
);
employeeRoutes.put('/:guid', updateEmployeeController.handle);
employeeRoutes.put(
  '/:guid/reset-password',
  resetEmployeePasswordController.handle
);
employeeRoutes.patch('/:guid', changeEmployeeStatusController.handle);

export { employeeRoutes };
