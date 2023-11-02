/* eslint-disable no-restricted-syntax */
import { PeriodStatus as PrismaPeriodStatus, Status } from '@prisma/client';
import dayjs from 'dayjs';
import {
  excludeFields,
  generateEnrollmentNumber,
  parseArrayOfData,
} from '../../helpers/utils';
import { AppError, ErrorMessages } from '../../infra/http/errors';
import { prismaClient } from '../../infra/prisma';
import { FindAllArgs, IRepository } from '../../interfaces';
import {
  ClassSchedule,
  DisciplineGradeConfig,
  DisciplineSchedule,
  Period,
} from '../domains';
import { PeriodValidator } from '../domains/validations';
import {
  CreatePeriodDTO,
  DisciplineDTO,
  DisciplineGradeConfigDTO,
  DisciplineScheduleDTO,
  GenericStatus,
  GradeItemDTO,
  GradeItemType,
  PeriodStatus,
  StudentEnrollmentDTO,
  UpdatePeriodDTO,
} from '../dtos';

export interface FindAllPeriodsArgs
  extends Omit<FindAllArgs, 'filterByStatus'> {
  filterByStatus?: PeriodStatus;
}

export class PeriodRepository implements IRepository {
  private DEFAULT_DISCIPLINE_GRADE_CONFIG: DisciplineGradeConfigDTO = {
    gradeItems: [
      {
        maxValue: 10,
        name: 'Verificação de aprendizagem (VA)',
        type: GradeItemType.average,
      },
    ],
  };

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
        deadline: dayjs(period.deadline)
          .set('hour', 0)
          .set('minute', 0)
          .set('second', 0)
          .toISOString(),
        enrollmentEndDate: dayjs(period.enrollmentEndDate)
          .set('hour', 0)
          .set('minute', 0)
          .set('second', 0)
          .toISOString(),
        enrollmentStartDate: dayjs(period.enrollmentStartDate)
          .set('hour', 0)
          .set('minute', 0)
          .set('second', 0)
          .toISOString(),
        matrixModuleGuid: period.matrixModuleGuid,
        vacancies: period.vacancies,
        classroomGuid: period.classroomGuid,
        shiftGuid: period.shiftGuid,
      },
      include: {
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
            schedules: {
              orderBy: {
                dayOfWeek: 'asc',
              },
            },
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
        });

        createdDisciplinesSchedule.push(createdSchedule);
      }
    }

    return {
      guid: createdPeriod.guid,
      status: createdPeriod.status as PeriodStatus,
      name: `${createdPeriod.matrixModule.Matrix.course.name}/${
        createdPeriod.matrixModule.Matrix.name
      } - ${createdPeriod.matrixModule.name}${
        createdPeriod.classId ? ` (Turma ${createdPeriod.classId})` : ''
      }`,
      disciplinesSchedule: createdDisciplinesSchedule.map(
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
    };
  }

  async update(guid: string, data: UpdatePeriodDTO) {
    const foundPeriod = await prismaClient.period.findUnique({
      where: { guid },
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
          include: {
            disciplines: true,
          },
        },
      },
    });

    if (!foundPeriod) throw new AppError(ErrorMessages.MSGE05, 404);

    const periodToUpdate = excludeFields(foundPeriod, [
      'createdAt',
      'updatedAt',
    ]) as typeof foundPeriod;

    const disciplinesSchedule = this.createDisciplinesScheduleFromDTO(
      periodToUpdate.disciplinesSchedule.map((disciplineSchedule) => ({
        guid: disciplineSchedule.guid,
        employeeGuid: disciplineSchedule.employeeGuid,
        employeeName: disciplineSchedule.educator.name,
        disciplineGuid: disciplineSchedule.disciplineGuid,
        disciplineName: disciplineSchedule.Discipline.name,
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
      period.status === PeriodStatus.canceled &&
      periodToUpdate.status !== PeriodStatus.draft &&
      periodToUpdate.status !== PeriodStatus.notStarted
    ) {
      throw new AppError(ErrorMessages.MSGE06);
    }

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
        deadline: dayjs(period.deadline)
          .set('hour', 0)
          .set('minute', 0)
          .set('second', 0)
          .toISOString(),
        enrollmentEndDate: dayjs(period.enrollmentEndDate)
          .set('hour', 0)
          .set('minute', 0)
          .set('second', 0)
          .toISOString(),
        enrollmentStartDate: dayjs(period.enrollmentStartDate)
          .set('hour', 0)
          .set('minute', 0)
          .set('second', 0)
          .toISOString(),
        matrixModuleGuid: period.matrixModuleGuid,
        vacancies: period.vacancies,
        classroomGuid: period.classroomGuid,
        shiftGuid: period.shiftGuid,
      },
      include: {
        disciplinesSchedule: {
          include: {
            schedules: {
              orderBy: {
                dayOfWeek: 'asc',
              },
            },
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
    });

    return {
      guid: updatedPeriod.guid,
      status: updatedPeriod.status as PeriodStatus,
      name: `${updatedPeriod.matrixModule.Matrix.course.name}/${
        updatedPeriod.matrixModule.Matrix.name
      } - ${updatedPeriod.matrixModule.name}${
        updatedPeriod.classId ? ` (Turma ${updatedPeriod.classId})` : ''
      }`,
      disciplinesSchedule: updatedPeriod.disciplinesSchedule.map(
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
    };
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
            schedules: {
              orderBy: {
                dayOfWeek: 'asc',
              },
            },
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

  async findByGuid(guid: string) {
    const period = await prismaClient.period.findUnique({
      where: { guid },
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
            Matrix: {
              select: {
                guid: true,
              },
            },
          },
        },
      },
    });

    if (!period) throw new AppError(ErrorMessages.MSGE05, 404);

    return excludeFields(
      {
        ...period,
        matrixGuid: period.matrixModule.Matrix.guid,
        disciplinesSchedule: parseArrayOfData(
          period.disciplinesSchedule.map((disciplineSchedule) => ({
            ...disciplineSchedule,
            disciplineName: disciplineSchedule.Discipline.name,
            employeeName: disciplineSchedule.educator.name,
            schedules: parseArrayOfData(disciplineSchedule.schedules, [
              'createdAt',
              'updatedAt',
            ]),
          })),
          ['createdAt', 'updatedAt', 'Discipline', 'educator']
        ),
      },
      ['createdAt', 'updatedAt', 'matrixModule']
    );
  }

  async enrollStudents(
    guid: string,
    studentsGuidList: string[]
  ): Promise<StudentEnrollmentDTO[]> {
    const period = await prismaClient.period.findUnique({
      where: { guid },
      include: {
        matrixModule: {
          include: {
            Matrix: { include: { course: { include: { enrollments: true } } } },
          },
        },
      },
    });

    if (!period) throw new AppError(ErrorMessages.MSGE05, 404);

    const hasDuplicatedStudents =
      studentsGuidList.length !== new Set(studentsGuidList).size;

    if (hasDuplicatedStudents) throw new AppError(ErrorMessages.MSGE15);

    const students = await prismaClient.student.findMany({
      where: {
        guid: {
          in: studentsGuidList,
        },
        status: {
          equals: Status.active,
        },
      },
    });

    if (students.length < studentsGuidList.length)
      throw new AppError(ErrorMessages.MSGE05, 404);

    const { enrollments, guid: courseGuid } = period.matrixModule.Matrix.course;

    for await (const studentGuid of studentsGuidList) {
      const currentStudentEnrollment = enrollments.find(
        (e) => e.studentGuid === studentGuid
      );

      if (currentStudentEnrollment) {
        if (currentStudentEnrollment.periodGuid === period.guid)
          throw new AppError(ErrorMessages.MSGE02);

        await prismaClient.enrollment.update({
          where: { guid: currentStudentEnrollment.guid },
          data: {
            periodGuid: period.guid,
          },
        });
      } else {
        await prismaClient.enrollment.create({
          data: {
            courseGuid,
            studentGuid,
            periodGuid: guid,
            enrollmentNumber: generateEnrollmentNumber(),
          },
        });
      }
    }

    const periodEnrollments = await prismaClient.enrollment.findMany({
      where: {
        periodGuid: period.guid,
      },
      include: {
        student: { select: { guid: true, name: true } },
      },
      orderBy: {
        student: {
          name: 'asc',
        },
      },
    });

    return periodEnrollments.map((enrollment) => ({
      guid: enrollment.guid,
      enrollmentNumber: enrollment.enrollmentNumber,
      studentName: enrollment.student.name,
      studentGuid: enrollment.student.guid,
    }));
  }

  async findPeriodEnrollments(guid: string) {
    const period = await prismaClient.period.findUnique({
      where: { guid },
      include: {
        enrollments: {
          include: {
            student: { select: { guid: true, name: true } },
          },
          orderBy: {
            student: {
              name: 'asc',
            },
          },
        },
      },
    });

    if (!period) throw new AppError(ErrorMessages.MSGE05, 404);

    return period.enrollments.map((enrollment) => ({
      guid: enrollment.guid,
      enrollmentNumber: enrollment.enrollmentNumber,
      studentName: enrollment.student.name,
      studentGuid: enrollment.student.guid,
    }));
  }

  async cancelEnrollment(periodGuid: string, enrollmentGuid: string) {
    const enrollmentToDelete = await prismaClient.enrollment.findFirst({
      where: { guid: enrollmentGuid, periodGuid },
    });

    if (!enrollmentToDelete) throw new AppError(ErrorMessages.MSGE05, 404);

    await prismaClient.enrollment.delete({
      where: { guid: enrollmentGuid },
    });
  }

  async updateDisciplineGradeConfig(
    periodGuid: string,
    disciplineGuid: string,
    data: DisciplineGradeConfigDTO
  ) {
    if (
      JSON.stringify(data) ===
      JSON.stringify(this.DEFAULT_DISCIPLINE_GRADE_CONFIG)
    ) {
      return this.DEFAULT_DISCIPLINE_GRADE_CONFIG;
    }

    const disciplineGradeConfig = new DisciplineGradeConfig(
      data.gradeItems,
      data.guid
    );

    disciplineGradeConfig.validate();

    const existingConfig = await prismaClient.disciplineGradeConfig.findFirst({
      where: { periodGuid, disciplineGuid },
    });

    if (!existingConfig) {
      const createdConfig = await prismaClient.disciplineGradeConfig.create({
        data: {
          periodGuid,
          disciplineGuid,
        },
        select: {
          guid: true,
        },
      });

      const gradeItems = await prismaClient.$transaction(
        data.gradeItems.map(({ maxValue, name, type }) =>
          prismaClient.gradeItem.create({
            data: {
              name,
              type,
              maxValue,
              disciplineGradeConfigGuid: createdConfig.guid,
            },
            select: {
              guid: true,
              name: true,
              type: true,
              maxValue: true,
            },
          })
        )
      );

      return {
        ...createdConfig,
        gradeItems,
      };
    }

    if (!data.guid) throw new AppError(ErrorMessages.MSGE05, 404);

    const disciplineGradeConfigToUpdate =
      await prismaClient.disciplineGradeConfig.findUnique({
        where: { guid: data.guid },
        select: {
          guid: true,
          gradeItems: {
            select: {
              guid: true,
              name: true,
              type: true,
              maxValue: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

    if (!disciplineGradeConfigToUpdate)
      throw new AppError(ErrorMessages.MSGE05, 404);

    if (
      JSON.stringify(disciplineGradeConfigToUpdate.gradeItems) !==
      JSON.stringify(disciplineGradeConfig.gradeItems)
    ) {
      const itemsToDelete = disciplineGradeConfigToUpdate.gradeItems.filter(
        (item) =>
          !disciplineGradeConfig.gradeItems.find((i) => i.guid === item.guid)
      );
      const itemsToCreate = disciplineGradeConfig.gradeItems.filter(
        (item) => !item.guid
      );
      const itemsToUpdate =
        disciplineGradeConfig.gradeItems.flatMap<GradeItemDTO>((item) => {
          if (!item.guid) return [];

          const currentItem = disciplineGradeConfigToUpdate.gradeItems.find(
            (i) => i.guid === item.guid
          );

          if (JSON.stringify(currentItem) === JSON.stringify(item)) return [];

          return item;
        });

      if (itemsToDelete.length) {
        await prismaClient.gradeItem.deleteMany({
          where: {
            disciplineGradeConfigGuid: data.guid,
            guid: {
              in: itemsToDelete.map((item) => item.guid),
            },
          },
        });
      }

      if (itemsToCreate.length) {
        await prismaClient.$transaction(
          itemsToCreate.map(({ maxValue, name, type }) =>
            prismaClient.gradeItem.create({
              data: {
                name,
                type,
                maxValue,
                disciplineGradeConfigGuid: data.guid,
              },
            })
          )
        );
      }

      if (itemsToUpdate.length) {
        await prismaClient.$transaction(
          itemsToUpdate.map(({ guid, maxValue, name, type }) =>
            prismaClient.gradeItem.update({
              where: { guid },
              data: {
                name,
                type,
                maxValue,
              },
            })
          )
        );
      }
    }

    const updatedConfig = await prismaClient.disciplineGradeConfig.findUnique({
      where: { guid: data.guid },
      select: {
        guid: true,
        gradeItems: {
          select: {
            guid: true,
            name: true,
            type: true,
            maxValue: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    return updatedConfig;
  }

  async findDisciplineGradeConfig(periodGuid: string, disciplineGuid: string) {
    const disciplineGradeConfig =
      await prismaClient.disciplineGradeConfig.findFirst({
        where: { periodGuid, disciplineGuid },
        select: {
          guid: true,
          gradeItems: {
            select: {
              guid: true,
              name: true,
              type: true,
              maxValue: true,
            },
          },
        },
      });

    if (!disciplineGradeConfig) return this.DEFAULT_DISCIPLINE_GRADE_CONFIG;

    return disciplineGradeConfig;
  }
}
