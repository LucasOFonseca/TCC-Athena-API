import { PeriodStatus as PrismaPeriodStatus } from '@prisma/client';
import { excludeFields, parseArrayOfData } from '../../helpers/utils';
import { AppError, ErrorMessages } from '../../infra/http/errors';
import { prismaClient } from '../../infra/prisma';
import { FindAllArgs, IRepository } from '../../interfaces';
import { ClassSchedule, DisciplineSchedule, Period } from '../domains';
import { checkScheduleAvailability } from '../domains/validations';
import {
  CreatePeriodDTO,
  DisciplineScheduleDTO,
  EmployeeRole,
  GenericStatus,
  PeriodStatus,
  UpdatePeriodDTO,
} from '../dtos';

export class PeriodRepository implements IRepository {
  async create({
    status,
    classId,
    classroomGuid,
    deadline,
    disciplinesSchedule: disciplinesScheduleData,
    enrollmentEndDate,
    enrollmentStartDate,
    matrixModuleGuid,
    shiftGuid,
    vacancies,
  }: CreatePeriodDTO) {
    if (classId && matrixModuleGuid) {
      const existingPeriod = await prismaClient.period.findFirst({
        where: { classId, matrixModuleGuid },
      });

      if (existingPeriod) throw new AppError(ErrorMessages.MSGE02);
    }

    if (status !== PeriodStatus.draft && !disciplinesScheduleData) {
      throw new AppError(ErrorMessages.MSGE01);
    }

    const disciplinesSchedule = disciplinesScheduleData?.map(
      (disciplineScheduleData) => {
        const schedules = disciplineScheduleData.schedules.map((schedule) => {
          const newSchedule = new ClassSchedule(
            schedule.shiftGuid,
            schedule.dayOfWeek,
            schedule.classNumber,
            schedule.startTime,
            schedule.endTime,
            schedule.guid,
            schedule.status
          );

          newSchedule.validate();

          return newSchedule;
        });

        const newDisciplineSchedule = new DisciplineSchedule(
          disciplineScheduleData.employeeGuid,
          disciplineScheduleData.disciplineGuid,
          schedules
        );

        newDisciplineSchedule.validate();

        return newDisciplineSchedule;
      }
    );

    const period = new Period(
      matrixModuleGuid,
      enrollmentStartDate,
      enrollmentEndDate,
      deadline,
      vacancies,
      classroomGuid,
      shiftGuid,
      classId,
      disciplinesSchedule,
      status
    );

    period.validate();

    if (classroomGuid) {
      const selectedClassroom = await prismaClient.classroom.findUnique({
        where: { guid: classroomGuid },
        include: {
          disciplinesSchedule: {
            include: {
              schedules: true,
            },
            where: {
              schedules: {
                some: {
                  shiftGuid,
                },
              },
            },
          },
        },
      });

      if (!selectedClassroom) throw new AppError(ErrorMessages.MSGE05, 404);

      if (selectedClassroom.status === GenericStatus.inactive)
        throw new AppError(ErrorMessages.MSGE16, 404);

      if (selectedClassroom.capacity < vacancies)
        throw new AppError(ErrorMessages.MSGE06);

      if (
        selectedClassroom.disciplinesSchedule.length !== 0 &&
        disciplinesSchedule
      ) {
        const isClassroomAvailable = checkScheduleAvailability(
          selectedClassroom.disciplinesSchedule as unknown as DisciplineScheduleDTO[],
          disciplinesSchedule
        );

        if (!isClassroomAvailable) throw new AppError(ErrorMessages.MSGE16);
      }
    }

    if (shiftGuid) {
      const selectedShift = await prismaClient.shift.findUnique({
        where: { guid: shiftGuid },
      });

      if (selectedShift.status === GenericStatus.inactive)
        throw new AppError(ErrorMessages.MSGE16, 404);
    }

    const selectedMatrixModule = await prismaClient.matrixModule.findUnique({
      where: { guid: matrixModuleGuid },
      include: {
        Matrix: true,
        disciplines: {
          select: {
            guid: true,
            weeklyClasses: true,
          },
        },
      },
    });

    if (!selectedMatrixModule) throw new AppError(ErrorMessages.MSGE05, 404);

    if (selectedMatrixModule.Matrix.status === GenericStatus.inactive)
      throw new AppError(ErrorMessages.MSGE16, 404);

    if (disciplinesScheduleData) {
      const isDisciplinesScheduleValid =
        selectedMatrixModule.disciplines.every((discipline) => {
          const isNotDuplicated =
            disciplinesSchedule.filter(
              (disciplineSchedule) =>
                discipline.guid === disciplineSchedule.disciplineGuid
            ).length === 1;

          const disciplineSchedule = disciplinesSchedule.find(
            (schedule) => schedule.disciplineGuid === discipline.guid
          );

          if (!disciplineSchedule) return false;

          const hasEnoughClasses =
            disciplineSchedule.schedules.length === discipline.weeklyClasses;

          return isNotDuplicated && hasEnoughClasses;
        }) &&
        disciplinesSchedule.length === selectedMatrixModule.disciplines.length;

      const hasSchedulesWithWrongShift = disciplinesSchedule.some(
        ({ schedules }) => schedules.some((s) => s.shiftGuid !== shiftGuid)
      );

      if (!isDisciplinesScheduleValid || hasSchedulesWithWrongShift)
        throw new AppError(ErrorMessages.MSGE06);

      const allSelectedEmployeesGuidList = disciplinesSchedule
        .map(({ employeeGuid }) => employeeGuid)
        .filter((guid, index, array) => array.indexOf(guid) === index);

      // eslint-disable-next-line no-restricted-syntax
      for await (const employeeGuid of allSelectedEmployeesGuidList) {
        const employee = await prismaClient.employee.findUnique({
          where: { guid: employeeGuid },
          include: {
            roles: {
              select: {
                role: true,
              },
            },
            disciplinesSchedule: {
              include: {
                schedules: true,
              },
            },
          },
        });

        if (!employee) throw new AppError(ErrorMessages.MSGE05, 404);

        if (employee.status === GenericStatus.inactive)
          throw new AppError(ErrorMessages.MSGE16, 404);

        if (
          !employee.roles.some((role) => role.role === EmployeeRole.educator)
        ) {
          throw new AppError(ErrorMessages.MSGE06);
        }

        if (employee.disciplinesSchedule.length > 0) {
          const isEmployeeAvailable = checkScheduleAvailability(
            employee.disciplinesSchedule as unknown as DisciplineScheduleDTO[],
            disciplinesSchedule
          );

          if (!isEmployeeAvailable) throw new AppError(ErrorMessages.MSGE16);
        }
      }
    }

    const createdPeriod = await prismaClient.period.create({
      data: {
        status: status as PrismaPeriodStatus,
        classId: period.classId,
        deadline: period.deadline,
        enrollmentEndDate: period.enrollmentEndDate,
        enrollmentStartDate: period.enrollmentStartDate,
        matrixModuleGuid: period.matrixModuleGuid,
        vacancies: period.vacancies,
        classroomGuid: period.classroomGuid,
        shiftGuid: period.shiftGuid,
      },
    });

    const createdDisciplinesSchedule = [];

    if (disciplinesSchedule) {
      // eslint-disable-next-line no-restricted-syntax
      for await (const schedule of disciplinesSchedule) {
        const createdSchedule = await prismaClient.disciplineSchedule.create({
          data: {
            periodGuid: createdPeriod.guid,
            classroomGuid: period.classroomGuid,
            disciplineGuid: schedule.disciplineGuid,
            employeeGuid: schedule.employeeGuid,
            schedules: {
              connect: schedule.schedules.map((s) => ({
                guid: s.guid,
              })),
            },
          },
          include: {
            schedules: true,
          },
        });

        createdDisciplinesSchedule.push(createdSchedule);
      }
    }

    return excludeFields(
      {
        ...createdPeriod,
        disciplineSchedules: parseArrayOfData(
          createdDisciplinesSchedule.map((s) => ({
            ...s,
            schedules: parseArrayOfData(s.schedules, [
              'createdAt',
              'updatedAt',
            ]),
          })),
          ['createdAt', 'updatedAt']
        ),
      },
      ['createdAt', 'updatedAt']
    );
  }

  async update(guid: string, data: UpdatePeriodDTO) {
    const periodToUpdate = await prismaClient.period.findUnique({
      where: { guid },
    });

    if (!periodToUpdate) throw new AppError(ErrorMessages.MSGE05, 404);
  }

  async findAll(args?: FindAllArgs) {
    return {
      data: [],
      totalItems: 0,
    };
  }

  async findByGuid(guid: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
