import { Router } from 'express';
import {
  CreateAttendanceLogController,
  GetAttendanceLogDetailsController,
  ListAttendanceLogsController,
  UpdateAttendanceLogController,
} from '../../../controllers/attendanceLog';

const attendanceLogRoutes = Router();

const createAttendanceLogController = new CreateAttendanceLogController();
const listAttendanceLogsController = new ListAttendanceLogsController();
const getAttendanceLogDetailsController =
  new GetAttendanceLogDetailsController();
const updateAttendanceLogController = new UpdateAttendanceLogController();

attendanceLogRoutes.post('/', createAttendanceLogController.handle);
attendanceLogRoutes.get(
  '/:periodGuid/:disciplineGuid',
  listAttendanceLogsController.handle
);
attendanceLogRoutes.get('/:guid', getAttendanceLogDetailsController.handle);
attendanceLogRoutes.put('/:guid', updateAttendanceLogController.handle);

export { attendanceLogRoutes };
