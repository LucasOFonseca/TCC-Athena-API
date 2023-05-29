import { excludeFields, parseArrayOfData } from '../../helpers/utils';
import { prismaClient } from '../../infra/prisma';
import { ClassScheduleDTO, GenericStatus } from '../dtos';

export class ShiftRepository {
  async update(guid: string, status: GenericStatus) {
    const updatedShift = await prismaClient.shift.update({
      where: {
        guid,
      },
      data: {
        status,
      },
    });

    return excludeFields(updatedShift, ['createdAt', 'updatedAt']);
  }

  async findAll() {
    const shifts = await prismaClient.shift.findMany({
      orderBy: {
        shift: 'asc',
      },
    });

    return parseArrayOfData(shifts, ['createdAt', 'updatedAt']);
  }

  async findShiftClassSchedules(shiftGuid: string) {
    const { ClassSchedules: schedules } = await prismaClient.shift.findUnique({
      where: {
        guid: shiftGuid,
      },
      select: {
        ClassSchedules: {
          orderBy: {
            dayOfWeek: 'asc',
          },
        },
      },
    });

    if (schedules.length === 0) return [];

    const schedulesToReturn: ClassScheduleDTO[][] = [];

    for (let i = 0; i < 6; i += 1) {
      const schedulesToPush = schedules.filter(
        (schedule) => schedule.classNumber === i + 1
      );

      if (schedulesToPush.length > 0) {
        schedulesToReturn.push(
          parseArrayOfData(schedulesToPush, [
            'createdAt',
            'updatedAt',
          ]) as ClassScheduleDTO[]
        );
      }
    }

    return schedulesToReturn;
  }
}
