import { Router } from 'express';
import { CreateEmployeeController } from '../../../controllers/employee';

const employeeRoutes = Router();

const createEmployeeController = new CreateEmployeeController();

employeeRoutes.post('/', createEmployeeController.handle);

export { employeeRoutes };
