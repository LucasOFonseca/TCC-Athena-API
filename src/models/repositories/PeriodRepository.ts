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
  StudentGradeDTO,
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
    if (classId && matrixModuleGuid && status !== PeriodStatus.draft) {
      await this.validator.checkIfPeriodExists(classId, matrixModuleGuid);
    }

    if (status !== PeriodStatus.draft && !disciplinesScheduleData) {
      throw new AppError(ErrorMessages.MSGE01);
    }

    const schedulesToCreate = disciplinesScheduleData.filter(
      (disciplineSchedule) => disciplineSchedule.schedules.length > 0
    );

    let disciplinesSchedule: DisciplineSchedule[] | undefined;

    if (schedulesToCreate.length > 0) {
      disciplinesSchedule =
        this.createDisciplinesScheduleFromDTO(schedulesToCreate);
    }

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

    if (disciplinesSchedule) {
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
        deadline: period.deadline
          ? dayjs(period.deadline)
              .set('hour', 0)
              .set('minute', 0)
              .set('second', 0)
              .toISOString()
          : undefined,
        enrollmentEndDate: period.enrollmentEndDate
          ? dayjs(period.enrollmentEndDate)
              .set('hour', 0)
              .set('minute', 0)
              .set('second', 0)
              .toISOString()
          : undefined,
        enrollmentStartDate: period.enrollmentStartDate
          ? dayjs(period.enrollmentStartDate)
              .set('hour', 0)
              .set('minute', 0)
              .set('second', 0)
              .toISOString()
          : undefined,
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

    const schedulesToCreate = data.disciplinesSchedule?.filter(
      (disciplineSchedule) => disciplineSchedule.schedules.length > 0
    );

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
    if (schedulesToCreate !== undefined && schedulesToCreate.length > 0)
      period.disciplinesSchedule =
        this.createDisciplinesScheduleFromDTO(schedulesToCreate);
    if (data.status !== undefined) period.status = data.status;

    if (period.status !== PeriodStatus.canceled) period.validate();

    if (
      period.status === PeriodStatus.canceled &&
      periodToUpdate.status !== PeriodStatus.draft &&
      periodToUpdate.status !== PeriodStatus.notStarted
    ) {
      throw new AppError(ErrorMessages.MSGE06);
    }

    if (
      period.status !== PeriodStatus.draft &&
      period.status !== PeriodStatus.inProgress &&
      period.enrollmentStartDate !==
        periodToUpdate.enrollmentStartDate.toISOString() &&
      (dayjs(periodToUpdate.enrollmentStartDate).isBefore(new Date(), 'day') ||
        dayjs(periodToUpdate.enrollmentStartDate).isSame(new Date(), 'day'))
    ) {
      throw new AppError(ErrorMessages.MSGE06);
    }

    if (
      period.status !== PeriodStatus.draft &&
      period.status !== PeriodStatus.inProgress &&
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

      if (period.classroomGuid) {
        await this.validator.checkClassroomAvailability(
          period.classroomGuid,
          period.shiftGuid,
          period.vacancies,
          disciplinesSchedule,
          periodToUpdate.guid
        );
      }
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
            disciplinesSchedule.filter((s) => s.employeeGuid === employeeGuid)
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
        deadline: period.deadline
          ? dayjs(period.deadline)
              .set('hour', 0)
              .set('minute', 0)
              .set('second', 0)
              .toISOString()
          : undefined,
        enrollmentEndDate: period.enrollmentEndDate
          ? dayjs(period.enrollmentEndDate)
              .set('hour', 0)
              .set('minute', 0)
              .set('second', 0)
              .toISOString()
          : undefined,
        enrollmentStartDate: period.enrollmentStartDate
          ? dayjs(period.enrollmentStartDate)
              .set('hour', 0)
              .set('minute', 0)
              .set('second', 0)
              .toISOString()
          : undefined,
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

  async findSimplifiedByGuid(guid: string) {
    const period = await prismaClient.period.findUnique({
      where: { guid },
      select: {
        guid: true,
        status: true,
        classId: true,
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

    if (!period) throw new AppError(ErrorMessages.MSGE05, 404);

    return {
      guid: period.guid,
      status: period.status as PeriodStatus,
      name: `${period.matrixModule.Matrix.course.name}/${
        period.matrixModule.Matrix.name
      } - ${period.matrixModule.name}${
        period.classId ? ` (Turma ${period.classId})` : ''
      }`,
      disciplinesSchedule: period.disciplinesSchedule.map(
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

  async enrollStudents(
    guid: string,
    studentsGuidList: string[]
  ): Promise<StudentEnrollmentDTO[]> {
    const period = await prismaClient.period.findUnique({
      where: { guid },
      include: {
        matrixModule: {
          include: {
            Matrix: {
              include: {
                course: {
                  include: {
                    enrollments: {
                      select: {
                        guid: true,
                        studentGuid: true,
                        periods: {
                          select: {
                            guid: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
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
        if (currentStudentEnrollment.periods.some((p) => p.guid === guid))
          throw new AppError(ErrorMessages.MSGE02);

        await prismaClient.enrollment.update({
          where: { guid: currentStudentEnrollment.guid },
          data: {
            periods: {
              connect: {
                guid,
              },
            },
          },
        });
      } else {
        await prismaClient.enrollment.create({
          data: {
            courseGuid,
            studentGuid,
            enrollmentNumber: generateEnrollmentNumber(),
            periods: {
              connect: {
                guid,
              },
            },
          },
        });
      }
    }

    const periodEnrollments = await prismaClient.enrollment.findMany({
      where: {
        periods: {
          some: {
            guid,
          },
        },
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
    const enrollmentToCancel = await prismaClient.enrollment.findFirst({
      where: { guid: enrollmentGuid, periods: { some: { guid: periodGuid } } },
    });

    if (!enrollmentToCancel) throw new AppError(ErrorMessages.MSGE05, 404);

    await prismaClient.enrollment.update({
      where: { guid: enrollmentGuid },
      data: {
        periods: {
          disconnect: {
            guid: periodGuid,
          },
        },
      },
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
              createdAt: 'asc',
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
            createdAt: 'asc',
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
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      });

    if (!disciplineGradeConfig) {
      const newConfig = await prismaClient.disciplineGradeConfig.create({
        data: {
          periodGuid,
          disciplineGuid,
          gradeItems: {
            create: this.DEFAULT_DISCIPLINE_GRADE_CONFIG.gradeItems[0],
          },
        },
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
              createdAt: 'asc',
            },
          },
        },
      });

      return newConfig;
    }

    return disciplineGradeConfig;
  }

  async updateStudentsGrades(
    periodGuid: string,
    disciplineGuid: string,
    data: StudentGradeDTO[]
  ) {
    const config = await this.findDisciplineGradeConfig(
      periodGuid,
      disciplineGuid
    );

    for (let i = 0; i < data.length; i += 1) {
      const studentGrade = data[i];

      const hasAllGradeItems = config.gradeItems.every((item) =>
        studentGrade.gradeItems.some(
          ({ gradeItemGuid }) => gradeItemGuid === item.guid
        )
      );

      if (!hasAllGradeItems) throw new AppError(ErrorMessages.MSGE06);
    }

    const studentGrades = await prismaClient.studentGrade.findMany({
      where: {
        periodGuid,
        disciplineGuid,
      },
      include: {
        studentGradeItems: true,
      },
    });

    for await (const studentGrade of data) {
      const existingGrade = studentGrades.find(
        (grade) => grade.studentGuid === studentGrade.studentGuid
      );

      const valuesToSum = studentGrade.gradeItems.filter(
        (item) => item.type === GradeItemType.sum
      );
      const valuesToAverage = studentGrade.gradeItems.filter(
        (item) => item.type === GradeItemType.average
      );

      const average =
        valuesToAverage.reduce((acc, item) => acc + item.value, 0) /
        valuesToAverage.length;

      const sum = valuesToSum.reduce((acc, item) => acc + item.value, 0);

      const total = Number((average + sum).toFixed(1));

      if (!existingGrade) {
        const createdGrade = await prismaClient.studentGrade.create({
          data: {
            periodGuid,
            disciplineGuid,
            studentGuid: studentGrade.studentGuid,
            finalValue: total > 10 ? 10 : total,
          },
        });

        await prismaClient.$transaction(
          studentGrade.gradeItems.map((item) =>
            prismaClient.studentGradeItem.create({
              data: {
                studentGradeGuid: createdGrade.guid,
                gradeItemGuid: item.gradeItemGuid,
                value: item.value,
              },
            })
          )
        );
      } else {
        const itemsToCreate = studentGrade.gradeItems.filter(
          (item) => !item.guid
        );
        const itemsToDelete = existingGrade.studentGradeItems.filter(
          (item) => !studentGrade.gradeItems.find((i) => i.guid === item.guid)
        );
        const itemsToUpdate = studentGrade.gradeItems.flatMap((item) => {
          if (!item.guid) return [];

          const currentItem = existingGrade.studentGradeItems.find(
            (i) => i.guid === item.guid
          );

          if (JSON.stringify(currentItem) === JSON.stringify(item)) return [];

          return item;
        });

        if (itemsToCreate.length) {
          await prismaClient.$transaction(
            itemsToCreate.map((item) =>
              prismaClient.studentGradeItem.create({
                data: {
                  studentGradeGuid: existingGrade.guid,
                  gradeItemGuid: item.gradeItemGuid,
                  value: item.value,
                },
              })
            )
          );
        }

        if (itemsToDelete.length) {
          await prismaClient.studentGradeItem.deleteMany({
            where: {
              studentGradeGuid: existingGrade.guid,
              gradeItemGuid: {
                in: itemsToDelete.map((item) => item.guid),
              },
            },
          });
        }

        if (itemsToUpdate.length) {
          await prismaClient.$transaction(
            itemsToUpdate.map((item) =>
              prismaClient.studentGradeItem.update({
                where: {
                  guid: item.guid,
                },
                data: {
                  value: item.value,
                },
              })
            )
          );
        }

        await prismaClient.studentGrade.update({
          where: {
            guid: existingGrade.guid,
          },
          data: {
            finalValue: total > 10 ? 10 : total,
          },
        });
      }
    }

    const dataToReturn = await this.findStudentsGrades(
      periodGuid,
      disciplineGuid
    );

    return dataToReturn;
  }

  async findStudentsGrades(periodGuid: string, disciplineGuid: string) {
    const grades = await prismaClient.studentGrade.findMany({
      where: {
        periodGuid,
        disciplineGuid,
      },
      select: {
        guid: true,
        finalValue: true,
        studentGuid: true,
        student: {
          select: {
            name: true,
          },
        },
        studentGradeItems: {
          select: {
            guid: true,
            value: true,
            gradeItemGuid: true,
            gradeItem: {
              select: {
                name: true,
                maxValue: true,
                type: true,
              },
            },
          },
          orderBy: {
            gradeItem: {
              createdAt: 'asc',
            },
          },
        },
      },
      orderBy: {
        student: {
          name: 'asc',
        },
      },
    });

    const dataToReturn: StudentGradeDTO[] = grades.map(
      ({
        guid: gradeGuid,
        studentGuid,
        finalValue,
        studentGradeItems,
        student,
      }) => ({
        guid: gradeGuid,
        studentGuid,
        studentName: student.name,
        finalValue,
        gradeItems: studentGradeItems.map(
          ({ guid, value, gradeItemGuid, gradeItem }) => ({
            guid,
            value,
            gradeItemGuid,
            name: gradeItem.name,
            maxValue: gradeItem.maxValue,
            type: gradeItem.type as GradeItemType,
          })
        ),
      })
    );

    return dataToReturn;
  }
}
