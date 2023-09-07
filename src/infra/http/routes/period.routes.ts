import { Router } from 'express';
import { CreatePeriodController } from '../../../controllers/period';

const periodRoutes = Router();

const createPeriodController = new CreatePeriodController();
// const listPeriodsController = new ListPeriodsController();
// const updatePeriodController = new UpdatePeriodController();
// const changePeriodStatusController = new ChangePeriodStatusController();

periodRoutes.post('/', createPeriodController.handle);
// periodRoutes.get('/', listClassroomsController.handle);
// periodRoutes.put('/:guid', updateClassroomController.handle);
// periodRoutes.patch('/:guid', changeClassroomStatusController.handle);

export { periodRoutes };
