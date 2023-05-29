import { Router } from 'express';
import {
  ChangeClassScheduleStatusController,
  CreateClassSchedulesController,
  UpdateClassSchedulesController,
} from '../../../controllers/classSchedule';

const classScheduleRoutes = Router();

const createClassSchedulesController = new CreateClassSchedulesController();
const updateClassSchedulesController = new UpdateClassSchedulesController();
const changeClassScheduleStatusController =
  new ChangeClassScheduleStatusController();

classScheduleRoutes.post('/', createClassSchedulesController.handle);
classScheduleRoutes.put('/', updateClassSchedulesController.handle);
classScheduleRoutes.patch('/:guid', changeClassScheduleStatusController.handle);

export { classScheduleRoutes };
