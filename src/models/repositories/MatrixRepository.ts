import dayjs from 'dayjs';
import { AppError, ErrorMessages } from '../../infra/http/errors';
import { prismaClient } from '../../infra/prisma';
import { FindAllArgs, FindAllReturn, IRepository } from '../../interfaces';
import { Matrix } from '../domains';
import {
  CreateMatrixDTO,
  GenericStatus,
  MatrixBaseDTO,
  MatrixDTO,
  UpdateMatrixDTO,
} from '../dtos';
import { CourseRepository, DisciplineRepository } from '.';

export class MatrixRepository implements IRepository {
  courseRepository = new CourseRepository();
  disciplineRepository = new DisciplineRepository();

  async create({
    courseGuid,
    modules,
    name,
  }: CreateMatrixDTO): Promise<MatrixBaseDTO> {
    const existingMatrix = await prismaClient.matrix.findFirst({
      where: { AND: [{ courseGuid }, { name }] },
    });

    if (existingMatrix) {
      throw new AppError(ErrorMessages.MSGE02);
    }

    const matrix = new Matrix(name, courseGuid, modules);

    matrix.validate();

    const allDisciplinesGuid = modules.map((module) => {
      return module.disciplines.map((discipline) => discipline.guid);
    })[0];
    const disciplinesToUse = await this.disciplineRepository.findManyByGuidList(
      allDisciplinesGuid
    );
    const courseToUse = await this.courseRepository.findByGuid(courseGuid);

    if (
      disciplinesToUse.some(
        (discipline) => discipline.status === GenericStatus.inactive
      ) ||
      courseToUse.status === GenericStatus.inactive
    ) {
      throw new AppError(ErrorMessages.MSGE16, 404);
    }

    const createdMatrix = await prismaClient.matrix.create({
      data: {
        name: matrix.name,
        courseGuid: matrix.courseGuid,
      },
      include: {
        course: {
          select: {
            name: true,
          },
        },
      },
    });

    matrix.modules.forEach(async (module, index) => {
      await prismaClient.matrixModule.create({
        data: {
          matrixGuid: createdMatrix.guid,
          name: module.name,
          createdAt: dayjs()
            .set('millisecond', 0 + index)
            .toDate(),
          disciplines: {
            connect: module.disciplines.map(({ guid }) => ({
              guid,
            })),
          },
        },
      });
    });

    return {
      guid: createdMatrix.guid,
      status: createdMatrix.status as GenericStatus,
      name: `${createdMatrix.course.name} - ${createdMatrix.name}`,
    };
  }

  async update(guid: string, data: UpdateMatrixDTO) {
    const matrixToUpdate = await prismaClient.matrix.findUnique({
      where: { guid },
      include: {
        matrixModules: {
          include: {
            disciplines: {
              select: {
                guid: true,
                name: true,
                workload: true,
              },
            },
          },
        },
      },
    });

    if (!matrixToUpdate) {
      throw new AppError(ErrorMessages.MSGE05, 404);
    }

    const parsedMatrixModules = matrixToUpdate.matrixModules.map(
      ({ guid: moduleGuid, name, disciplines }) => ({
        guid: moduleGuid,
        name,
        disciplines,
      })
    );

    const matrix = new Matrix(
      matrixToUpdate.name,
      matrixToUpdate.courseGuid,
      parsedMatrixModules,
      matrixToUpdate.status as GenericStatus,
      matrixToUpdate.guid
    );

    if (data.name !== undefined) matrix.name = data.name;
    if (data.courseGuid !== undefined) matrix.courseGuid = data.courseGuid;
    if (data.modules !== undefined) matrix.modules = data.modules;
    if (data.status !== undefined) matrix.status = data.status;

    matrix.validate();

    if (
      matrix.courseGuid !== matrixToUpdate.courseGuid ||
      matrix.name !== matrixToUpdate.name
    ) {
      const courseToUse = await this.courseRepository.findByGuid(
        matrix.courseGuid
      );

      if (courseToUse.status === GenericStatus.inactive) {
        throw new AppError(ErrorMessages.MSGE16, 404);
      }

      const existingMatrix = await prismaClient.matrix.findFirst({
        where: {
          AND: [{ courseGuid: matrix.courseGuid }, { name: matrix.name }],
        },
      });

      if (existingMatrix) {
        throw new AppError(ErrorMessages.MSGE02);
      }
    }

    const needsToUpdateModules =
      JSON.stringify(matrix.modules) !== JSON.stringify(parsedMatrixModules);

    if (needsToUpdateModules) {
      const modulesToDelete = matrixToUpdate.matrixModules.filter(
        (module) => !matrix.modules.some((m) => module.guid === m.guid ?? '')
      );

      const allDisciplinesGuid = matrix.modules.map((module) => {
        return module.disciplines.map((discipline) => discipline.guid);
      })[0];
      const disciplinesToUse =
        await this.disciplineRepository.findManyByGuidList(allDisciplinesGuid);

      if (
        disciplinesToUse.some(
          (discipline) => discipline.status === GenericStatus.inactive
        )
      ) {
        throw new AppError(ErrorMessages.MSGE16, 404);
      }

      await prismaClient.matrixModule.deleteMany({
        where: {
          AND: [
            { matrixGuid: matrixToUpdate.guid },
            {
              guid: {
                in: modulesToDelete.map((module) => module.guid),
              },
            },
          ],
        },
      });

      // eslint-disable-next-line no-restricted-syntax
      for await (const module of matrix.modules) {
        if (module.guid) {
          const moduleIndex = matrixToUpdate.matrixModules.findIndex(
            (m) => m.guid === module.guid
          );
          const needsToUpdateDisciplines =
            JSON.stringify(module.disciplines) !==
            JSON.stringify(parsedMatrixModules[moduleIndex].disciplines);

          await prismaClient.matrixModule.update({
            where: {
              guid: module.guid,
            },
            data: {
              name: module.name,
              disciplines: needsToUpdateDisciplines
                ? {
                    connect: module.disciplines.map((discipline) => ({
                      guid: discipline.guid,
                    })),
                  }
                : undefined,
            },
          });
        } else {
          await prismaClient.matrixModule.create({
            data: {
              matrixGuid: matrix.guid,
              name: module.name,
              disciplines: {
                connect: module.disciplines.map((discipline) => ({
                  guid: discipline.guid,
                })),
              },
            },
          });
        }
      }
    }

    const updatedMatrix = await prismaClient.matrix.update({
      where: {
        guid,
      },
      data: {
        name: matrix.name,
        courseGuid: matrix.courseGuid,
        status: matrix.status,
      },
      include: {
        course: {
          select: {
            name: true,
          },
        },
        matrixModules: {
          include: {
            disciplines: {
              select: {
                guid: true,
                name: true,
                workload: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    return {
      guid: updatedMatrix.guid,
      status: updatedMatrix.status as GenericStatus,
      courseGuid: updatedMatrix.courseGuid,
      courseName: updatedMatrix.course.name,
      name: updatedMatrix.name,
      modules: updatedMatrix.matrixModules.map((module) => ({
        guid: module.guid,
        name: module.name,
        disciplines: module.disciplines,
      })),
    };
  }

  async findAll(args?: FindAllArgs): Promise<FindAllReturn> {
    const where = {
      OR: args?.searchTerm
        ? [
            {
              name: {
                contains: args?.searchTerm,
              },
            },
            {
              course: {
                name: {
                  contains: args?.searchTerm,
                },
              },
            },
          ]
        : undefined,
      status: {
        equals: args?.filterByStatus as GenericStatus,
      },
    };

    const totalItems = await prismaClient.matrix.count({ where });

    const data = await prismaClient.matrix.findMany({
      where,
      include: {
        course: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      data: data.map((matrix) => ({
        guid: matrix.guid,
        status: matrix.status,
        name: `${matrix.course.name} - ${matrix.name}`,
      })),
      totalItems,
    };
  }

  async findByGuid(guid: string): Promise<MatrixDTO> {
    try {
      const matrix = await prismaClient.matrix.findUniqueOrThrow({
        where: { guid },
        include: {
          matrixModules: {
            select: {
              guid: true,
              name: true,
              disciplines: {
                select: {
                  guid: true,
                  name: true,
                  workload: true,
                  weeklyClasses: true,
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      });

      return {
        guid: matrix.guid,
        name: matrix.name,
        status: matrix.status as GenericStatus,
        courseGuid: matrix.courseGuid,
        modules: matrix.matrixModules,
      };
    } catch {
      throw new AppError(ErrorMessages.MSGE05, 404);
    }
  }
}
