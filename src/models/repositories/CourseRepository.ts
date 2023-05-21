import { excludeFields, parseArrayOfData } from '../../helpers/utils';
import { AppError, ErrorMessages } from '../../infra/http/errors';
import { prismaClient } from '../../infra/prisma';
import { FindAllArgs, IRepository } from '../../interfaces';
import { Course } from '../domains';
import {
  CourseDTO,
  CreateCourseDTO,
  GenericStatus,
  UpdateCourseDTO,
} from '../dtos';

export class CourseRepository implements IRepository {
  async create({ name }: CreateCourseDTO) {
    const existingCourse = await prismaClient.course.findUnique({
      where: { name },
    });

    if (existingCourse) {
      throw new AppError(ErrorMessages.MSGE02);
    }

    const course = new Course(name);

    course.validate();

    const createdCourse = await prismaClient.course.create({
      data: {
        name: course.name,
      },
    });

    return excludeFields(createdCourse, ['createdAt', 'updatedAt']);
  }

  async update(guid: string, data: UpdateCourseDTO) {
    try {
      const courseToUpdate = await prismaClient.course.findUniqueOrThrow({
        where: { guid },
      });

      const course = new Course(
        courseToUpdate.name,
        courseToUpdate.guid,
        courseToUpdate.status as GenericStatus
      );

      if (data.name !== undefined) course.name = data.name;
      if (data.status !== undefined) course.status = data.status;

      course.validate();

      if (course.name !== courseToUpdate.name) {
        const existingCourse = await prismaClient.course.findUnique({
          where: { name: course.name },
        });

        if (existingCourse) {
          throw new AppError(ErrorMessages.MSGE02);
        }
      }

      if (
        course.status !== courseToUpdate.status &&
        course.status === GenericStatus.inactive
      ) {
        const isInUse =
          (await prismaClient.matrix.count({
            where: { courseGuid: guid },
          })) > 0;

        if (isInUse) throw new AppError(ErrorMessages.MSGE04);
      }

      const updatedCourse = await prismaClient.course.update({
        where: { guid },
        data: course.toJSON(),
      });

      return excludeFields(updatedCourse, ['createdAt', 'updatedAt']);
    } catch (e) {
      if (e instanceof AppError || e instanceof Error) throw e;

      throw new AppError(ErrorMessages.MSGE05, 404);
    }
  }

  async findAll(args?: FindAllArgs) {
    const where = {
      OR: args.searchTerm
        ? [
            {
              name: {
                contains: args?.searchTerm,
              },
            },
          ]
        : undefined,
      status: {
        equals: args?.filterByStatus,
      },
    };

    const totalItems = await prismaClient.course.count({ where });

    const data = await prismaClient.course.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: args?.skip,
      take: args?.take,
    });

    return {
      data: parseArrayOfData(data, ['createdAt', 'updatedAt']),
      totalItems,
    };
  }

  async findByGuid(guid: string): Promise<CourseDTO> {
    try {
      const course = await prismaClient.course.findUniqueOrThrow({
        where: { guid },
      });

      return excludeFields(course, ['createdAt', 'updatedAt']) as CourseDTO;
    } catch {
      throw new AppError(ErrorMessages.MSGE05, 404);
    }
  }
}
