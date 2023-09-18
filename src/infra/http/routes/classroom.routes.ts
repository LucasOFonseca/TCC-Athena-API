import { Router } from 'express';
import {
  ChangeClassroomStatusController,
  CreateClassroomController,
  GetClassroomByGuidController,
  ListClassroomsController,
  UpdateClassroomController,
} from '../../../controllers/classroom';

const classroomRoutes = Router();

const createClassroomController = new CreateClassroomController();
const listClassroomsController = new ListClassroomsController();
const getClassroomByGuidController = new GetClassroomByGuidController();
const updateClassroomController = new UpdateClassroomController();
const changeClassroomStatusController = new ChangeClassroomStatusController();

classroomRoutes.post('/', createClassroomController.handle);
classroomRoutes.get('/', listClassroomsController.handle);
classroomRoutes.get('/:guid', getClassroomByGuidController.handle);
classroomRoutes.put('/:guid', updateClassroomController.handle);
classroomRoutes.patch('/:guid', changeClassroomStatusController.handle);

export { classroomRoutes };
