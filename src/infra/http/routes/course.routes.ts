import { Router } from 'express';
import {
  ChangeCourseStatusController,
  CreateCourseController,
  ListCoursesController,
  UpdateCourseController,
} from '../../../controllers/course';

const courseRoutes = Router();

const createCourseController = new CreateCourseController();
const listCoursesController = new ListCoursesController();
const updateCourseController = new UpdateCourseController();
const changeCourseStatusController = new ChangeCourseStatusController();

courseRoutes.post('/', createCourseController.handle);
courseRoutes.get('/', listCoursesController.handle);
courseRoutes.put('/:guid', updateCourseController.handle);
courseRoutes.patch('/:guid', changeCourseStatusController.handle);

export { courseRoutes };
