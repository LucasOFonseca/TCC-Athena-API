/* eslint-disable no-restricted-syntax */
import { AppError, ErrorMessages } from '../../infra/http/errors';
import { prismaClient } from '../../infra/prisma';
import { ClassSchedule } from '../domains';
import {
  CreateClassScheduleDTO,
  DayOfWeek,
  GenericStatus,
  UpdateClassScheduleDTO,
} from '../dtos';

export class ClassScheduleRepository {
  async create(data: CreateClassScheduleDTO[]) {
    const existingClassSchedule = await prismaClient.classSchedule.findMany({
      where: {
        shiftGuid: data[0].shiftGuid,
        classNumber: data[0].classNumber,
        OR: data.map(({ dayOfWeek }) => ({
          dayOfWeek,
        })),
      },
    });

    if (existingClassSchedule.length > 0) {
      throw new AppError(ErrorMessages.MSGE02);
    }

    data.forEach(({ shiftGuid, dayOfWeek, classNumber }) => {
      const isDuplicate =
        data.filter(
          (classSchedule) =>
            classSchedule.shiftGuid === shiftGuid &&
            classSchedule.dayOfWeek === dayOfWeek &&
            classSchedule.classNumber === classNumber
        ).length > 1;

      if (isDuplicate) throw new AppError(ErrorMessages.MSGE15);
    });

    const validatedData = data.map(
      ({ classNumber, shiftGuid, dayOfWeek, startTime, endTime }) => {
        const classSchedule = new ClassSchedule(
          shiftGuid,
          dayOfWeek,
          classNumber,
          startTime,
          endTime
        );

        classSchedule.validate();

        return classSchedule.toJSON();
      }
    );

    await prismaClient.classSchedule.createMany({
      data: validatedData,
    });
  }

  async update(data: UpdateClassScheduleDTO[]) {
    for await (const schedule of data) {
      const scheduleToUpdate = await prismaClient.classSchedule.findUnique({
        where: {
          guid: schedule.guid,
        },
      });

      if (!scheduleToUpdate) throw new AppError(ErrorMessages.MSGE05, 404);

      const classSchedule = new ClassSchedule(
        scheduleToUpdate.shiftGuid,
        scheduleToUpdate.dayOfWeek as DayOfWeek,
        scheduleToUpdate.classNumber,
        scheduleToUpdate.startTime.toISOString(),
        scheduleToUpdate.endTime.toISOString(),
        scheduleToUpdate.guid,
        scheduleToUpdate.status as GenericStatus
      );

      if (schedule.shiftGuid !== undefined)
        classSchedule.shiftGuid = schedule.shiftGuid;
      if (schedule.dayOfWeek !== undefined)
        classSchedule.dayOfWeek = schedule.dayOfWeek;
      if (schedule.classNumber !== undefined)
        classSchedule.classNumber = schedule.classNumber;
      if (schedule.startTime !== undefined)
        classSchedule.startTime = schedule.startTime;
      if (schedule.endTime !== undefined)
        classSchedule.endTime = schedule.endTime;
      if (schedule.status !== undefined) classSchedule.status = schedule.status;

      classSchedule.validate();

      if (
        classSchedule.classNumber !== scheduleToUpdate.classNumber ||
        classSchedule.dayOfWeek !== scheduleToUpdate.dayOfWeek ||
        classSchedule.shiftGuid !== scheduleToUpdate.shiftGuid
      ) {
        const existingClassSchedule =
          await prismaClient.classSchedule.findFirst({
            where: {
              classNumber: classSchedule.classNumber,
              dayOfWeek: classSchedule.dayOfWeek,
              shiftGuid: classSchedule.shiftGuid,
            },
          });

        if (existingClassSchedule) throw new AppError(ErrorMessages.MSGE02);
      }

      await prismaClient.classSchedule.update({
        where: {
          guid: schedule.guid,
        },
        data: classSchedule.toJSON(),
      });
    }
  }
}
