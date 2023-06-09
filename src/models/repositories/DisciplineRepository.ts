import { excludeFields, parseArrayOfData } from '../../helpers/utils';
import { AppError, ErrorMessages } from '../../infra/http/errors';
import { prismaClient } from '../../infra/prisma';
import { FindAllArgs, IRepository } from '../../interfaces';
import { Discipline } from '../domains';
import {
  CreateDisciplineDTO,
  DisciplineDTO,
  GenericStatus,
  UpdateDisciplineDTO,
} from '../dtos';

export class DisciplineRepository implements IRepository {
  async create({
    name,
    syllabus,
    workload,
    weeklyClasses,
  }: CreateDisciplineDTO) {
    const existingDiscipline = await prismaClient.discipline.findUnique({
      where: { name },
    });

    if (existingDiscipline) {
      throw new AppError(ErrorMessages.MSGE02);
    }

    const discipline = new Discipline(name, syllabus, workload, weeklyClasses);

    discipline.validate();

    const createdDiscipline = await prismaClient.discipline.create({
      data: {
        name: discipline.name,
        syllabus: discipline.syllabus,
        workload: discipline.workload,
        weeklyClasses: discipline.weeklyClasses,
      },
    });

    return excludeFields(createdDiscipline, ['createdAt', 'updatedAt']);
  }

  async update(guid: string, data: UpdateDisciplineDTO) {
    try {
      const disciplineToUpdate =
        await prismaClient.discipline.findUniqueOrThrow({ where: { guid } });

      const discipline = new Discipline(
        disciplineToUpdate.name,
        disciplineToUpdate.syllabus,
        disciplineToUpdate.workload,
        disciplineToUpdate.weeklyClasses,
        disciplineToUpdate.guid,
        disciplineToUpdate.status as GenericStatus
      );

      if (data.name !== undefined) discipline.name = data.name;
      if (data.syllabus !== undefined) discipline.syllabus = data.syllabus;
      if (data.workload !== undefined) discipline.workload = data.workload;
      if (data.status !== undefined) discipline.status = data.status;
      if (data.weeklyClasses !== undefined)
        discipline.weeklyClasses = data.weeklyClasses;

      discipline.validate();

      if (discipline.name !== disciplineToUpdate.name) {
        const existingDiscipline = await prismaClient.discipline.findUnique({
          where: { name: discipline.name },
        });

        if (existingDiscipline) {
          throw new AppError(ErrorMessages.MSGE02);
        }
      }

      if (
        discipline.status !== disciplineToUpdate.status &&
        discipline.status === GenericStatus.inactive
      ) {
        const isInUse =
          (await prismaClient.matrixModule.count({
            where: { disciplines: { some: { guid } } },
          })) > 0;

        if (isInUse) throw new AppError(ErrorMessages.MSGE04);
      }

      const updatedDiscipline = await prismaClient.discipline.update({
        where: { guid },
        data: discipline.toJSON(),
      });

      return excludeFields(updatedDiscipline, ['createdAt', 'updatedAt']);
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
            {
              syllabus: {
                contains: args?.searchTerm,
              },
            },
          ]
        : undefined,
      status: {
        equals: args?.filterByStatus,
      },
    };

    const totalItems = await prismaClient.discipline.count({ where });

    const data = await prismaClient.discipline.findMany({
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

  async findManyByGuidList(guids: string[]): Promise<DisciplineDTO[]> {
    const disciplines = await prismaClient.discipline.findMany({
      where: { guid: { in: guids } },
    });

    return parseArrayOfData(disciplines, [
      'createdAt',
      'updatedAt',
    ]) as DisciplineDTO[];
  }
}
