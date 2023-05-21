import { Router } from 'express';
import {
  ChangeMatrixStatusController,
  CreateMatrixController,
  GetMatrixDetailsController,
  ListMatricesController,
  UpdateMatrixController,
} from '../../../controllers/matrix';

const matrixRoutes = Router();

const createMatrixController = new CreateMatrixController();
const getMatrixDetailsController = new GetMatrixDetailsController();
const listMatricesController = new ListMatricesController();
const updateMatrixController = new UpdateMatrixController();
const changeMatrixStatusController = new ChangeMatrixStatusController();

matrixRoutes.post('/', createMatrixController.handle);
matrixRoutes.get('/', listMatricesController.handle);
matrixRoutes.get('/:guid', getMatrixDetailsController.handle);
matrixRoutes.put('/:guid', updateMatrixController.handle);
matrixRoutes.patch('/:guid', changeMatrixStatusController.handle);

export { matrixRoutes };
