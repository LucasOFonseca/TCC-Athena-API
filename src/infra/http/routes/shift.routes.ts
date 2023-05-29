import { Router } from 'express';
import {
  ChangeShiftStatusController,
  ListShiftClassSchedulesController,
  ListShiftsController,
} from '../../../controllers/shift';

const shiftRoutes = Router();

const listShiftsController = new ListShiftsController();
const changeShiftStatusController = new ChangeShiftStatusController();
const listShiftClassSchedulesController =
  new ListShiftClassSchedulesController();

shiftRoutes.get('/', listShiftsController.handle);
shiftRoutes.patch('/:guid', changeShiftStatusController.handle);
shiftRoutes.get(
  '/:shiftGuid/class-schedules',
  listShiftClassSchedulesController.handle
);

export { shiftRoutes };
