import { Router } from 'express';
import {
  CreatePeriodController,
  ListPeriodsController,
  UpdatePeriodController,
} from '../../../controllers/period';

const periodRoutes = Router();

const createPeriodController = new CreatePeriodController();
const listPeriodsController = new ListPeriodsController();
const updatePeriodController = new UpdatePeriodController();
// const changePeriodStatusController = new ChangePeriodStatusController();

periodRoutes.post('/', createPeriodController.handle);
periodRoutes.get('/', listPeriodsController.handle);
periodRoutes.put('/:guid', updatePeriodController.handle);
// periodRoutes.patch('/:guid', changeClassroomStatusController.handle);

export { periodRoutes };
