import { excludeFields, parseArrayOfData } from '../../helpers/utils';
import { AppError, ErrorMessages } from '../../infra/http/errors';
import { prismaClient } from '../../infra/prisma';
import { FindAllArgs, IRepository } from '../../interfaces';
import { Classroom } from '../domains';
import { CreateClassroomDTO, GenericStatus, UpdateClassroomDTO } from '../dtos';

export class ClassroomRepository implements IRepository {
  async create({ name, capacity }: CreateClassroomDTO) {
    const existingClassroom = await prismaClient.classroom.findUnique({
      where: { name },
    });

    if (existingClassroom) {
      throw new AppError(ErrorMessages.MSGE02);
    }

    const classroom = new Classroom(name, capacity);

    classroom.validate();

    const createdClassroom = await prismaClient.classroom.create({
      data: {
        name: classroom.name,
        capacity: classroom.capacity,
      },
    });

    return excludeFields(createdClassroom, ['createdAt', 'updatedAt']);
  }

  async update(guid: string, data: UpdateClassroomDTO) {
    try {
      const classroomToUpdate = await prismaClient.classroom.findUniqueOrThrow({
        where: { guid },
      });

      const classroom = new Classroom(
        classroomToUpdate.name,
        classroomToUpdate.capacity,
        classroomToUpdate.guid,
        classroomToUpdate.status as GenericStatus
      );

      if (data.name !== undefined) classroom.name = data.name;
      if (data.capacity !== undefined) classroom.capacity = data.capacity;
      if (data.status !== undefined) classroom.status = data.status;

      classroom.validate();

      if (classroom.name !== classroomToUpdate.name) {
        const existingClassroom = await prismaClient.classroom.findUnique({
          where: { name: classroom.name },
        });

        if (existingClassroom) {
          throw new AppError(ErrorMessages.MSGE02);
        }
      }

      const updatedClassroom = await prismaClient.classroom.update({
        where: { guid },
        data: classroom.toJSON(),
      });

      return excludeFields(updatedClassroom, ['createdAt', 'updatedAt']);
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

    const totalItems = await prismaClient.classroom.count({ where });

    const data = await prismaClient.classroom.findMany({
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
}
