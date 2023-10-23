import { Router } from 'express';
import {
  ChangeEmployeeStatusController,
  CreateEmployeeController,
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
const listEmployeePeriodsController = new ListEmployeePeriodsController();
const listEmployeeDisciplinesByPeriodController =
  new ListEmployeeDisciplinesByPeriodController();
const updateEmployeeController = new UpdateEmployeeController();
const resetEmployeePasswordController = new ResetEmployeePasswordController();
const changeEmployeeStatusController = new ChangeEmployeeStatusController();

employeeRoutes.post('/', createEmployeeController.handle);
employeeRoutes.get('/', listEmployeesController.handle);
employeeRoutes.get('/:guid/schedules', listEmployeeSchedulesController.handle);
employeeRoutes.get('/:guid/periods', listEmployeePeriodsController.handle);
employeeRoutes.get(
  '/:employeeGuid/periods/:periodGuid/disciplines',
  listEmployeeDisciplinesByPeriodController.handle
);
employeeRoutes.put('/:guid', updateEmployeeController.handle);
employeeRoutes.put(
  '/:guid/reset-password',
  resetEmployeePasswordController.handle
);
employeeRoutes.patch('/:guid', changeEmployeeStatusController.handle);

export { employeeRoutes };
