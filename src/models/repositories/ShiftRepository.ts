import dayjs from 'dayjs';
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

  async findShiftClassSchedules(
    shiftGuid: string,
    filterByStatus?: GenericStatus
  ) {
    const shift = await prismaClient.shift.findFirst({
      where: {
        guid: shiftGuid,
        status: filterByStatus,
      },
      select: {
        ClassSchedules: {
          orderBy: {
            dayOfWeek: 'asc',
          },
          where: {
            status: filterByStatus,
          },
        },
      },
    });

    if (!shift) return [];

    const { ClassSchedules: schedules } = shift;

    if (schedules.length === 0) return [];

    const schedulesToReturn: ClassScheduleDTO[][] = [];

    for (let i = 0; i < 6; i += 1) {
      const schedulesToPush = schedules.filter(
        (schedule) => schedule.classNumber === i + 1
      );

      if (schedulesToPush.length > 0) {
        schedulesToReturn.push(
          parseArrayOfData(
            schedulesToPush.map((schedule) => {
              const dayjsStartTime = dayjs(schedule.startTime);
              const dayjsEndTime = dayjs(schedule.endTime);

              return {
                ...schedule,
                startTime: dayjs()
                  .set('hour', dayjsStartTime.hour())
                  .set('minute', dayjsStartTime.minute())
                  .toISOString(),
                endTime: dayjs()
                  .set('hour', dayjsEndTime.hour())
                  .set('minute', dayjsEndTime.minute())
                  .toISOString(),
              };
            }),
            ['createdAt', 'updatedAt']
          ) as ClassScheduleDTO[]
        );
      }
    }

    return schedulesToReturn;
  }
}
