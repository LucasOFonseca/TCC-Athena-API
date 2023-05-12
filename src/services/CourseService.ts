import { FindAllArgs, IService } from '../interfaces';
import {
  CreateCourseDTO,
  GenericStatus,
  UpdateCourseDTO,
} from '../models/dtos';
import { CourseRepository } from '../models/repositories';

export class CourseService implements IService {
  private courseRepository = new CourseRepository();

  async create(data: CreateCourseDTO) {
    const course = await this.courseRepository.create(data);

    return course;
  }

  async update(guid: string, data: UpdateCourseDTO) {
    const updatedCourse = await this.courseRepository.update(guid, data);

    return updatedCourse;
  }

  async changeStatus(guid: string, status: GenericStatus) {
    const updatedCourse = await this.courseRepository.update(guid, {
      status,
    });

    return updatedCourse;
  }

  async list(args?: FindAllArgs) {
    const result = await this.courseRepository.findAll(args);

    return result;
  }
}
