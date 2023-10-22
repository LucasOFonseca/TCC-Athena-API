/* eslint-disable no-restricted-syntax */
import { excludeFields } from '../../helpers/utils';
import { AppError, ErrorMessages } from '../../infra/http/errors';
import { prismaClient } from '../../infra/prisma';
import { FindAllArgs, IRepository } from '../../interfaces';
import { AttendanceLog } from '../domains';
import { CreateAttendanceLogDTO } from '../dtos/attendanceLog';

export class AttendanceLogRepository implements IRepository {
  async create({
    classDate,
    disciplineGuid,
    periodGuid,
    studentAbsences,
    totalClasses,
  }: CreateAttendanceLogDTO) {
    const attendanceLog = new AttendanceLog(
      periodGuid,
      disciplineGuid,
      classDate,
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
      },
    });

    const createdStudentAbsences = await prismaClient.studentAbsence.createMany(
      {
        data: attendanceLog.studentAbsences.map(
          ({ studentGuid, totalAbsences }) => ({
            studentGuid,
            totalAbsences,
            attendanceLogGuid: createdAttendanceLog.guid,
          })
        ),
      }
    );

    return excludeFields(
      { ...createdAttendanceLog, studentAbsences: createdStudentAbsences },
      ['createdAt', 'updatedAt']
    );
  }

  async update(guid: string, data: any) {
    throw new Error('Not implemented');
  }

  async findAll(args?: FindAllArgs) {
    return {
      data: [],
      totalItems: 0,
    };
  }
}
