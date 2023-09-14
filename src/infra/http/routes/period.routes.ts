import { Router } from 'express';
import {
  CancelPeriodController,
  CreatePeriodController,
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

periodRoutes.post('/', createPeriodController.handle);
periodRoutes.get('/', listPeriodsController.handle);
periodRoutes.get('/:guid', getPeriodDetailsController.handle);
periodRoutes.put('/:guid', updatePeriodController.handle);
periodRoutes.patch('/:guid/cancel', cancelPeriodController.handle);

export { periodRoutes };
