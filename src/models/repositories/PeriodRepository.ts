/* eslint-disable no-restricted-syntax */
import { PeriodStatus as PrismaPeriodStatus } from '@prisma/client';
import dayjs from 'dayjs';
import { excludeFields, parseArrayOfData } from '../../helpers/utils';
import { AppError, ErrorMessages } from '../../infra/http/errors';
import { prismaClient } from '../../infra/prisma';
import { FindAllArgs, IRepository } from '../../interfaces';
import { ClassSchedule, DisciplineSchedule, Period } from '../domains';
import { PeriodValidator } from '../domains/validations';
import {
  CreatePeriodDTO,
  DisciplineDTO,
  DisciplineScheduleDTO,
  GenericStatus,
  PeriodStatus,
  UpdatePeriodDTO,
} from '../dtos';

export interface FindAllPeriodsArgs
  extends Omit<FindAllArgs, 'filterByStatus'> {
  filterByStatus?: PeriodStatus;
}

export class PeriodRepository implements IRepository {
  private validator = new PeriodValidator();

  private createDisciplinesScheduleFromDTO(
    disciplinesScheduleDTO: DisciplineScheduleDTO[]
  ) {
    return disciplinesScheduleDTO?.map((disciplineScheduleData) => {
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
        schedules,
        disciplineScheduleData.guid
      );

      newDisciplineSchedule.validate();

      return newDisciplineSchedule;
    });
  }

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
      await this.validator.checkIfPeriodExists(classId, matrixModuleGuid);
    }

    if (status !== PeriodStatus.draft && !disciplinesScheduleData) {
      throw new AppError(ErrorMessages.MSGE01);
    }

    const disciplinesSchedule = this.createDisciplinesScheduleFromDTO(
      disciplinesScheduleData
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

    if (shiftGuid) {
      this.validator.checkShiftAvailability(shiftGuid);
    }

    if (classroomGuid) {
      await this.validator.checkClassroomAvailability(
        classroomGuid,
        shiftGuid,
        vacancies,
        disciplinesSchedule
      );
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
      await this.validator.validateDisciplinesSchedule(
        selectedMatrixModule.disciplines as unknown as DisciplineDTO[],
        disciplinesSchedule,
        shiftGuid
      );
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
        disciplinesSchedule: parseArrayOfData(
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
      include: {
        disciplinesSchedule: {
          include: {
            schedules: true,
          },
        },
        matrixModule: {
          include: {
            disciplines: true,
          },
        },
      },
    });

    if (!periodToUpdate) throw new AppError(ErrorMessages.MSGE05, 404);

    const disciplinesSchedule = this.createDisciplinesScheduleFromDTO(
      periodToUpdate.disciplinesSchedule.map((disciplineSchedule) => ({
        ...disciplineSchedule,
        schedules: disciplineSchedule.schedules.map((s) => ({
          ...s,
          startTime: s.startTime.toISOString(),
          endTime: s.endTime.toISOString(),
        })),
      })) as DisciplineScheduleDTO[]
    );

    const period = new Period(
      periodToUpdate.matrixModuleGuid,
      periodToUpdate.enrollmentStartDate?.toISOString(),
      periodToUpdate.enrollmentEndDate?.toISOString(),
      periodToUpdate.deadline?.toISOString(),
      periodToUpdate.vacancies,
      periodToUpdate.classroomGuid,
      periodToUpdate.shiftGuid,
      periodToUpdate.classId,
      disciplinesSchedule,
      periodToUpdate.status as PeriodStatus,
      periodToUpdate.guid
    );

    if (data.enrollmentStartDate !== undefined)
      period.enrollmentStartDate = data.enrollmentStartDate;
    if (data.enrollmentEndDate !== undefined)
      period.enrollmentEndDate = data.enrollmentEndDate;
    if (data.deadline !== undefined) period.deadline = data.deadline;
    if (data.vacancies !== undefined) period.vacancies = data.vacancies;
    if (data.classroomGuid !== undefined)
      period.classroomGuid = data.classroomGuid;
    if (data.shiftGuid !== undefined) period.shiftGuid = data.shiftGuid;
    if (data.classId !== undefined) period.classId = data.classId;
    if (data.disciplinesSchedule !== undefined)
      period.disciplinesSchedule = this.createDisciplinesScheduleFromDTO(
        data.disciplinesSchedule
      );
    if (data.status !== undefined) period.status = data.status;

    period.validate();

    if (
      period.status !== PeriodStatus.draft &&
      period.enrollmentStartDate !==
        periodToUpdate.enrollmentStartDate.toISOString() &&
      (dayjs(periodToUpdate.enrollmentStartDate).isBefore(new Date(), 'day') ||
        dayjs(periodToUpdate.enrollmentStartDate).isSame(new Date(), 'day'))
    ) {
      throw new AppError(ErrorMessages.MSGE06);
    }

    if (
      period.status !== PeriodStatus.draft &&
      period.enrollmentEndDate !==
        periodToUpdate.enrollmentEndDate.toISOString() &&
      (dayjs(periodToUpdate.enrollmentEndDate).isBefore(new Date(), 'day') ||
        dayjs(periodToUpdate.enrollmentEndDate).isSame(new Date(), 'day'))
    ) {
      throw new AppError(ErrorMessages.MSGE06);
    }

    if (period.classId !== periodToUpdate.classId) {
      await this.validator.checkIfPeriodExists(
        period.classId,
        period.matrixModuleGuid
      );
    }

    if (
      period.classroomGuid !== periodToUpdate.classroomGuid ||
      period.shiftGuid !== periodToUpdate.shiftGuid ||
      period.vacancies !== periodToUpdate.vacancies ||
      JSON.stringify(period.disciplinesSchedule) !==
        JSON.stringify(disciplinesSchedule)
    ) {
      if (period.shiftGuid !== periodToUpdate.shiftGuid) {
        await this.validator.checkShiftAvailability(period.shiftGuid);
      }

      await this.validator.checkClassroomAvailability(
        period.classroomGuid,
        period.shiftGuid,
        period.vacancies,
        disciplinesSchedule
      );
    }

    if (
      JSON.stringify(period.disciplinesSchedule) !==
      JSON.stringify(disciplinesSchedule)
    ) {
      if (
        period.disciplinesSchedule.filter(
          (schedule, index, array) => array.indexOf(schedule) === index
        ).length !== period.disciplinesSchedule.length
      ) {
        throw new AppError(ErrorMessages.MSGE15);
      }

      const disciplinesScheduleToDelete = disciplinesSchedule.filter(
        (schedule) =>
          !period.disciplinesSchedule.some((s) => s.guid === schedule.guid)
      );
      const disciplinesScheduleToCreate = period.disciplinesSchedule.filter(
        (schedule) => !schedule.guid
      );
      const disciplinesScheduleToUpdate = period.disciplinesSchedule
        .filter((schedule) => schedule.guid !== undefined)
        .filter((schedule) => {
          const currentSchedule = disciplinesSchedule.find(
            (s) => s.guid === schedule.guid
          );

          if (!currentSchedule) return false;

          if (JSON.stringify(schedule) !== JSON.stringify(currentSchedule))
            return true;

          return false;
        });

      if (disciplinesScheduleToDelete.length > 0) {
        await prismaClient.disciplineSchedule.deleteMany({
          where: {
            guid: {
              in: disciplinesScheduleToDelete.map((s) => s.guid),
            },
          },
        });
      }

      if (disciplinesScheduleToCreate.length > 0) {
        const isDisciplinesScheduleValid = disciplinesScheduleToCreate.every(
          (schedule) => {
            const discipline = periodToUpdate.matrixModule.disciplines.find(
              (d) => schedule.disciplineGuid === d.guid
            );

            if (!discipline) return false;

            const hasEnoughClasses =
              schedule.schedules.length === discipline.weeklyClasses;

            return hasEnoughClasses;
          }
        );

        const hasSchedulesWithWrongShift = disciplinesSchedule.some(
          ({ schedules }) =>
            schedules.some((s) => s.shiftGuid !== period.shiftGuid)
        );

        if (!isDisciplinesScheduleValid || hasSchedulesWithWrongShift)
          throw new AppError(ErrorMessages.MSGE06);

        const allSelectedEmployeesGuidList = disciplinesScheduleToCreate
          .map(({ employeeGuid }) => employeeGuid)
          .filter(
            (employeeGuid, index, array) =>
              array.indexOf(employeeGuid) === index
          );

        for await (const employeeGuid of allSelectedEmployeesGuidList) {
          await this.validator.checkEmployeeAvailability(
            employeeGuid,
            disciplinesSchedule
          );
        }

        for await (const schedule of disciplinesScheduleToCreate) {
          await prismaClient.disciplineSchedule.create({
            data: {
              periodGuid: period.guid,
              classroomGuid: period.classroomGuid,
              disciplineGuid: schedule.disciplineGuid,
              employeeGuid: schedule.employeeGuid,
              schedules: {
                connect: schedule.schedules.map((s) => ({
                  guid: s.guid,
                })),
              },
            },
          });
        }
      }

      if (disciplinesScheduleToUpdate.length > 0) {
        const isDisciplinesScheduleValid = disciplinesScheduleToCreate.every(
          (schedule) => {
            const discipline = periodToUpdate.matrixModule.disciplines.find(
              (d) => schedule.disciplineGuid === d.guid
            );

            if (!discipline) return false;

            const hasEnoughClasses =
              schedule.schedules.length === discipline.weeklyClasses;

            return hasEnoughClasses;
          }
        );

        const hasSchedulesWithWrongShift = disciplinesSchedule.some(
          ({ schedules }) =>
            schedules.some((s) => s.shiftGuid !== period.shiftGuid)
        );

        if (!isDisciplinesScheduleValid || hasSchedulesWithWrongShift)
          throw new AppError(ErrorMessages.MSGE06);

        for await (const schedule of disciplinesScheduleToUpdate) {
          const currentSchedule = disciplinesSchedule.find(
            (s) => s.guid === schedule.guid
          );

          if (schedule.employeeGuid !== currentSchedule.employeeGuid) {
            await this.validator.checkEmployeeAvailability(
              schedule.employeeGuid,
              disciplinesScheduleToUpdate
            );
          }
        }

        for await (const schedule of disciplinesScheduleToUpdate) {
          await prismaClient.disciplineSchedule.update({
            where: {
              guid: schedule.guid,
            },
            data: {
              periodGuid: period.guid,
              classroomGuid: period.classroomGuid,
              disciplineGuid: schedule.disciplineGuid,
              employeeGuid: schedule.employeeGuid,
              schedules: {
                set: schedule.schedules.map((s) => ({
                  guid: s.guid,
                })),
              },
            },
          });
        }
      }
    }

    const updatedPeriod = await prismaClient.period.update({
      where: { guid },
      data: {
        status: period.status as PrismaPeriodStatus,
        classId: period.classId,
        deadline: period.deadline,
        enrollmentEndDate: period.enrollmentEndDate,
        enrollmentStartDate: period.enrollmentStartDate,
        matrixModuleGuid: period.matrixModuleGuid,
        vacancies: period.vacancies,
        classroomGuid: period.classroomGuid,
        shiftGuid: period.shiftGuid,
      },
      include: {
        disciplinesSchedule: {
          include: {
            schedules: true,
          },
        },
      },
    });

    return excludeFields(
      {
        ...updatedPeriod,
        disciplinesSchedule: parseArrayOfData(
          updatedPeriod.disciplinesSchedule.map((s) => ({
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

  async findAll(args?: FindAllPeriodsArgs) {
    const where = {
      OR: args?.searchTerm
        ? [
            {
              matrixModule: {
                Matrix: {
                  course: {
                    name: {
                      contains: args?.searchTerm,
                    },
                  },
                },
              },
            },
            {
              matrixModule: {
                Matrix: {
                  name: {
                    contains: args?.searchTerm,
                  },
                },
              },
            },
            {
              matrixModule: {
                name: {
                  contains: args?.searchTerm,
                },
              },
            },
            {
              classId: {
                contains: args?.searchTerm,
              },
            },
          ]
        : undefined,
      status: {
        equals: args?.filterByStatus,
      },
    };

    const totalItems = await prismaClient.period.count({ where });

    const data = await prismaClient.period.findMany({
      where,
      include: {
        disciplinesSchedule: {
          include: {
            schedules: true,
            Discipline: {
              select: {
                name: true,
              },
            },
            educator: {
              select: {
                name: true,
              },
            },
          },
        },
        matrixModule: {
          select: {
            name: true,
            Matrix: {
              select: {
                name: true,
                course: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: args?.skip,
      take: args?.take,
    });

    return {
      data: data.map(
        ({ guid, status, matrixModule, classId, disciplinesSchedule }) => ({
          guid,
          status: status as PeriodStatus,
          name: `${matrixModule.Matrix.course.name}/${
            matrixModule.Matrix.name
          } - ${matrixModule.name}${classId ? ` (Turma ${classId})` : ''}`,
          disciplinesSchedule: disciplinesSchedule.map(
            (disciplineSchedule) => ({
              guid: disciplineSchedule.guid,
              name: disciplineSchedule.Discipline.name,
              educator: disciplineSchedule.educator.name,
              schedules: parseArrayOfData(disciplineSchedule.schedules, [
                'createdAt',
                'updatedAt',
              ]),
            })
          ),
        })
      ),
      totalItems,
    };
  }

  async findByGuid(guid: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
