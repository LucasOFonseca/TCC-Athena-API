import { Router } from 'express';
import {
  ChangeDisciplineStatusController,
  CreateDisciplineController,
  ListDisciplinesController,
  UpdateDisciplineController,
} from '../../../controllers/discipline';

const disciplineRoutes = Router();

const createDisciplineController = new CreateDisciplineController();
const listDisciplinesController = new ListDisciplinesController();
const updateDisciplineController = new UpdateDisciplineController();
const changeDisciplineStatusController = new ChangeDisciplineStatusController();

disciplineRoutes.post('/', createDisciplineController.handle);
disciplineRoutes.get('/', listDisciplinesController.handle);
disciplineRoutes.put('/:guid', updateDisciplineController.handle);
disciplineRoutes.patch('/:guid', changeDisciplineStatusController.handle);

export { disciplineRoutes };
