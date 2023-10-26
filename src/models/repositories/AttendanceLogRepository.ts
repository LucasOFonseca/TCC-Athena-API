/* eslint-disable no-restricted-syntax */
import dayjs from 'dayjs';
import { excludeFields, parseArrayOfData } from '../../helpers/utils';
import { AppError, ErrorMessages } from '../../infra/http/errors';
import { prismaClient } from '../../infra/prisma';
import { FindAllArgs, IRepository } from '../../interfaces';
import { AttendanceLog } from '../domains';
import { CreateAttendanceLogDTO, UpdateAttendanceLogDTO } from '../dtos';

export class AttendanceLogRepository implements Omit<IRepository, 'findAll'> {
  async create({
    classDate,
    classSummary,
    disciplineGuid,
    periodGuid,
    studentAbsences,
    totalClasses,
  }: CreateAttendanceLogDTO) {
    const attendanceLog = new AttendanceLog(
      periodGuid,
      disciplineGuid,
      classDate,
      classSummary,
      totalClasses,
      studentAbsences
    );

    attendanceLog.validate();

    for await (const studentAbsence of attendanceLog.studentAbsences) {
      const isEnrolled = await prismaClient.enrollment.findFirst({
        where: {
          studentGuid: studentAbsence.studentGuid,
          periodGuid,
          period: {
            matrixModule: {
              disciplines: {
                some: {
                  guid: disciplineGuid,
                },
              },
            },
          },
        },
      });

      if (!isEnrolled) throw new AppError(ErrorMessages.MSGE05, 404);

      if (studentAbsence.totalAbsences > totalClasses) {
        throw new AppError(ErrorMessages.MSGE11);
      }
    }

    const createdAttendanceLog = await prismaClient.attendanceLog.create({
      data: {
        periodGuid: attendanceLog.periodGuid,
        disciplineGuid: attendanceLog.disciplineGuid,
        classDate: attendanceLog.classDate,
        totalClasses: attendanceLog.totalClasses,
        classSummary: attendanceLog.classSummary,
      },
    });

    const createdStudentAbsences = await prismaClient.$transaction(
      attendanceLog.studentAbsences.map((studentAbsence) =>
        prismaClient.studentAbsence.create({
          data: {
            ...studentAbsence,
            totalPresences:
              attendanceLog.totalClasses - studentAbsence.totalAbsences,
            attendanceLogGuid: createdAttendanceLog.guid,
          },
        })
      )
    );

    return excludeFields(
      {
        ...createdAttendanceLog,
        studentAbsences: parseArrayOfData(createdStudentAbsences, [
          'createdAt',
          'updatedAt',
          'attendanceLogGuid',
        ]),
      },
      ['createdAt', 'updatedAt']
    );
  }

  async update(guid: string, data: UpdateAttendanceLogDTO) {
    const attendanceLogToUpdate = await prismaClient.attendanceLog.findUnique({
      where: {
        guid,
      },
      include: {
        studentAbsences: {
          select: {
            guid: true,
            studentGuid: true,
            totalAbsences: true,
            totalPresences: true,
          },
        },
      },
    });

    if (!attendanceLogToUpdate) throw new AppError(ErrorMessages.MSGE05, 404);

    const attendanceLog = new AttendanceLog(
      attendanceLogToUpdate.periodGuid,
      attendanceLogToUpdate.disciplineGuid,
      dayjs(attendanceLogToUpdate.classDate).format(),
      attendanceLogToUpdate.classSummary,
      attendanceLogToUpdate.totalClasses,
      attendanceLogToUpdate.studentAbsences,
      attendanceLogToUpdate.guid
    );

    if (data.classDate !== undefined) attendanceLog.classDate = data.classDate;
    if (data.classSummary !== undefined)
      attendanceLog.classSummary = data.classSummary;
    if (data.totalClasses !== undefined)
      attendanceLog.totalClasses = data.totalClasses;
    if (data.studentAbsences !== undefined)
      attendanceLog.studentAbsences = data.studentAbsences;

    if (attendanceLog.totalClasses !== attendanceLogToUpdate.totalClasses) {
      let isAllRegistersValid = true;

      for (let i = 0; i < attendanceLog.studentAbsences.length; i += 1) {
        const studentAbsence = attendanceLog.studentAbsences[i];

        if (studentAbsence.totalAbsences > attendanceLog.totalClasses) {
          isAllRegistersValid = false;
          break;
        }
      }

      if (!isAllRegistersValid) throw new AppError(ErrorMessages.MSGE11);
    }

    if (
      JSON.stringify(attendanceLog.studentAbsences) !==
      JSON.stringify(attendanceLogToUpdate.studentAbsences)
    ) {
      await prismaClient.$transaction(
        attendanceLog.studentAbsences.flatMap((studentAbsence) => {
          const oldStudentAbsence = attendanceLogToUpdate.studentAbsences.find(
            (value) => value.studentGuid === studentAbsence.studentGuid
          );

          if (
            oldStudentAbsence.totalAbsences !== studentAbsence.totalAbsences
          ) {
            return prismaClient.studentAbsence.update({
              where: {
                guid: studentAbsence.guid,
              },
              data: {
                totalAbsences: studentAbsence.totalAbsences,
                totalPresences:
                  attendanceLog.totalClasses - studentAbsence.totalAbsences,
              },
            });
          }

          return [];
        })
      );
    }

    const updatedAttendanceLog = await prismaClient.attendanceLog.update({
      where: {
        guid,
      },
      data: {
        classDate: attendanceLog.classDate,
        totalClasses: attendanceLog.totalClasses,
      },
      include: {
        studentAbsences: {
          select: {
            guid: true,
            studentGuid: true,
            totalPresences: true,
            totalAbsences: true,
          },
        },
      },
    });

    return excludeFields(updatedAttendanceLog, ['createdAt', 'updatedAt']);
  }

  async findAll(args: FindAllArgs, periodGuid: string, disciplineGuid: string) {
    const totalItems = await prismaClient.attendanceLog.count({
      where: {
        periodGuid,
        disciplineGuid,
      },
    });

    const data = await prismaClient.attendanceLog.findMany({
      where: {
        periodGuid,
        disciplineGuid,
      },
      select: {
        guid: true,
        classDate: true,
        classSummary: true,
      },
      orderBy: { classDate: 'desc' },
      skip: args?.skip,
      take: args?.take,
    });

    return {
      data,
      totalItems,
    };
  }

  async findByGuid(guid: string) {
    const attendanceLog = await prismaClient.attendanceLog.findUnique({
      where: {
        guid,
      },
      include: {
        studentAbsences: {
          select: {
            guid: true,
            studentGuid: true,
            totalAbsences: true,
            totalPresences: true,
          },
        },
      },
    });

    if (!attendanceLog) throw new AppError(ErrorMessages.MSGE05, 404);

    return excludeFields(attendanceLog, ['createdAt', 'updatedAt']);
  }
}
