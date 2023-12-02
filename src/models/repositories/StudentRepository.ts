/* eslint-disable no-nested-ternary */
import bcrypt from 'bcrypt';
import {
  allDaysOfWeek,
  compareClassSchedules,
  excludeFields,
  generatePassword,
} from '../../helpers/utils';
import { AppError, ErrorMessages } from '../../infra/http/errors';
import { prismaClient } from '../../infra/prisma';
import { FindAllArgs, IRepository } from '../../interfaces';
import { MailProvider } from '../../providers/mail';
import {
  firstAccessEmailTemplate,
  newPasswordEmailTemplate,
} from '../../providers/mail/templates';
import { Address, Student } from '../domains';
import {
  CreateStudentDTO,
  EmployeeRole,
  GenericStatus,
  PeriodStatus,
  Shift,
  StudentGradeStatus,
  UpdateStudentDTO,
} from '../dtos';

export class StudentRepository implements IRepository {
  async create({
    address: addressData,
    birthdate,
    cpf,
    email,
    name,
    phoneNumber,
  }: CreateStudentDTO) {
    const existingStudent = await prismaClient.student.findFirst({
      where: { OR: [{ cpf }, { email }] },
    });

    if (existingStudent) {
      throw new AppError(ErrorMessages.MSGE02);
    }

    const address = new Address(
      addressData.street,
      addressData.number,
      addressData.neighborhood,
      addressData.city,
      addressData.state,
      addressData.cep
    );

    address.validate();

    const student = new Student(
      name,
      cpf,
      birthdate,
      phoneNumber,
      email,
      generatePassword(),
      address.toJSON()
    );

    student.validate();

    const hashPassword = await bcrypt.hash(
      student.password,
      Number(process.env.BCRYPT_SALT)
    );

    const createdStudent = await prismaClient.student.create({
      data: {
        name: student.name,
        cpf: student.cpf,
        birthdate: student.birthdate,
        phoneNumber: student.phoneNumber,
        email: student.email,
        password: hashPassword,
        address: {
          create: {
            street: student.address.street,
            number: student.address.number,
            neighborhood: student.address.neighborhood,
            city: student.address.city,
            state: student.address.state,
            cep: student.address.cep,
          },
        },
      },
      include: {
        address: true,
      },
    });

    const mailProvider = new MailProvider();

    await mailProvider.sendMail(
      student.email,
      'Bem-vindo(a) ao Athena!',
      firstAccessEmailTemplate(student.name, student.email, student.password)
    );

    const dataToReturn = {
      ...excludeFields(createdStudent, [
        'createdAt',
        'updatedAt',
        'password',
        'addressGuid',
      ]),
      address: excludeFields(createdStudent.address, [
        'createdAt',
        'updatedAt',
      ]),
    };

    return dataToReturn;
  }

  async update(guid: string, data: UpdateStudentDTO) {
    const studentToUpdate = await prismaClient.student.findUnique({
      where: { guid },
      include: {
        address: true,
      },
    });

    if (!studentToUpdate) {
      throw new AppError(ErrorMessages.MSGE05, 404);
    }

    const address = new Address(
      studentToUpdate.address.street,
      studentToUpdate.address.number,
      studentToUpdate.address.neighborhood,
      studentToUpdate.address.city,
      studentToUpdate.address.state,
      studentToUpdate.address.cep,
      studentToUpdate.address.guid
    );

    if (data.address) {
      address.setAll(data.address);
      address.validate();
    }

    const student = new Student(
      studentToUpdate.name,
      studentToUpdate.cpf,
      studentToUpdate.birthdate.toISOString(),
      studentToUpdate.phoneNumber,
      studentToUpdate.email,
      studentToUpdate.password,
      address.toJSON(),
      studentToUpdate.status as GenericStatus,
      studentToUpdate.guid
    );

    if (data.name !== undefined) student.name = data.name;
    if (data.cpf !== undefined) student.cpf = data.cpf;
    if (data.birthdate !== undefined) student.birthdate = data.birthdate;
    if (data.phoneNumber !== undefined) student.phoneNumber = data.phoneNumber;
    if (data.email !== undefined) student.email = data.email;
    if (data.password !== undefined) student.password = data.password;
    if (data.status !== undefined) student.status = data.status;

    student.validate();

    if (student.cpf !== studentToUpdate.cpf) {
      const existingStudent = await prismaClient.student.findFirst({
        where: { cpf: student.cpf },
      });

      if (existingStudent) {
        throw new AppError(ErrorMessages.MSGE02);
      }
    }

    if (student.email !== studentToUpdate.email) {
      const existingStudent = await prismaClient.student.findFirst({
        where: { email: student.email },
      });

      if (existingStudent) {
        throw new AppError(ErrorMessages.MSGE02);
      }
    }

    let hashPassword: string;

    if (student.password !== studentToUpdate.password) {
      hashPassword = await bcrypt.hash(
        student.password,
        Number(process.env.BCRYPT_SALT)
      );
    }

    const updatedStudent = await prismaClient.student.update({
      where: { guid },
      data: {
        status: student.status,
        name: student.name,
        cpf: student.cpf,
        birthdate: student.birthdate,
        phoneNumber: student.phoneNumber,
        email: student.email,
        password: hashPassword,
        address: {
          update: {
            ...address.toJSON(),
          },
        },
      },
      include: {
        address: true,
      },
    });

    if (data.password) {
      const mailProvider = new MailProvider();

      await mailProvider.sendMail(
        student.email,
        'Novos dados de acesso ao Athena',
        newPasswordEmailTemplate(student.name, student.email, student.password)
      );
    }

    const dataToReturn = {
      ...excludeFields(updatedStudent, [
        'createdAt',
        'updatedAt',
        'password',
        'addressGuid',
      ]),
      address: excludeFields(updatedStudent.address, [
        'createdAt',
        'updatedAt',
      ]),
    };

    return dataToReturn;
  }

  async findAll(args?: FindAllArgs) {
    const where = {
      NOT: args?.itemsToExclude
        ? { guid: { in: args?.itemsToExclude } }
        : undefined,
      OR: args?.searchTerm
        ? [
            {
              name: {
                contains: args?.searchTerm,
              },
            },
            {
              cpf: {
                contains: args?.searchTerm,
              },
            },
            {
              email: {
                contains: args?.searchTerm,
              },
            },
          ]
        : undefined,
      status: {
        equals: args?.filterByStatus as GenericStatus,
      },
    };

    const totalItems = await prismaClient.student.count({
      where,
    });

    const data = await prismaClient.student.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: args?.skip,
      take: args?.take,
      include: {
        address: true,
      },
    });

    const dataToUse = data.map((student) => ({
      ...excludeFields(student, [
        'createdAt',
        'updatedAt',
        'password',
        'addressGuid',
      ]),
      address: excludeFields(student.address, ['createdAt', 'updatedAt']),
    }));

    return {
      data: dataToUse,
      totalItems,
    };
  }

  async findByEmail(email: string) {
    try {
      const student = await prismaClient.student.findUniqueOrThrow({
        where: { email },
      });

      return student;
    } catch {
      throw new AppError(ErrorMessages.MSGE05, 404);
    }
  }

  async findByGuid(guid: string) {
    try {
      const student = await prismaClient.student.findUniqueOrThrow({
        where: { guid },
      });

      return student;
    } catch {
      throw new AppError(ErrorMessages.MSGE02);
    }
  }

  async findStudentPeriods(guid: string) {
    const studentPeriods = await prismaClient.period.findMany({
      where: {
        status: {
          notIn: [PeriodStatus.finished, PeriodStatus.canceled],
        },
        enrollments: {
          some: {
            studentGuid: guid,
          },
        },
      },
      select: {
        guid: true,
        classId: true,
        status: true,
        deadline: true,
        matrixModule: {
          select: {
            name: true,
            disciplines: {
              select: {
                guid: true,
                name: true,
              },
            },
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

    return studentPeriods.map((period) => ({
      guid: period.guid,
      name: `${period.matrixModule.Matrix.course.name}/${period.matrixModule.Matrix.name} - ${period.matrixModule.name} (Turma ${period.classId})`,
      status: period.status,
      deadline: period.deadline,
      disciplines: period.matrixModule.disciplines,
    }));
  }

  async findStudentPeriodDetails(studentGuid: string, periodGuid: string) {
    const periodCourse = await prismaClient.period.findFirst({
      where: { guid: periodGuid },
      select: {
        matrixModule: {
          select: {
            Matrix: {
              select: {
                course: {
                  select: {
                    guid: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const courseGuid = periodCourse?.matrixModule?.Matrix?.course?.guid;

    const studentPeriod = await prismaClient.period.findFirst({
      where: {
        guid: periodGuid,
        status: {
          not: PeriodStatus.canceled,
        },
        enrollments: {
          some: {
            studentGuid,
          },
        },
      },
      select: {
        guid: true,
        classId: true,
        enrollmentEndDate: true,
        deadline: true,
        enrollments: {
          where: {
            studentGuid,
          },
          select: {
            enrollmentNumber: true,
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
                    minPassingGrade: true,
                  },
                },
                matrixModules: {
                  select: {
                    guid: true,
                    name: true,
                    disciplines: {
                      select: {
                        guid: true,
                        name: true,
                        attendanceLogs: {
                          where: {
                            period: {
                              matrixModule: {
                                Matrix: {
                                  course: {
                                    guid: courseGuid,
                                  },
                                },
                              },
                            },
                            studentAbsences: {
                              some: {
                                studentGuid,
                              },
                            },
                          },
                          select: {
                            studentAbsences: {
                              where: {
                                studentGuid,
                              },
                              select: {
                                totalAbsences: true,
                              },
                            },
                          },
                        },
                        studentGrades: {
                          where: {
                            studentGuid,
                            period: {
                              matrixModule: {
                                Matrix: {
                                  course: {
                                    guid: courseGuid,
                                  },
                                },
                              },
                            },
                          },
                          select: {
                            period: {
                              select: {
                                status: true,
                              },
                            },
                            studentGradeItems: {
                              select: {
                                guid: true,
                                value: true,
                                gradeItem: {
                                  select: {
                                    name: true,
                                  },
                                },
                              },
                            },
                            finalValue: true,
                          },
                        },
                      },
                    },
                  },
                  orderBy: {
                    createdAt: 'asc',
                  },
                },
              },
            },
          },
        },
      },
    });

    return {
      guid: studentPeriod.guid,
      classId: studentPeriod.classId,
      course: studentPeriod.matrixModule.Matrix.course.name,
      matrix: studentPeriod.matrixModule.Matrix.name,
      currentModuleName: studentPeriod.matrixModule.name,
      classesStartDate: studentPeriod.enrollmentEndDate,
      deadline: studentPeriod.deadline,
      enrollmentNumber: studentPeriod.enrollments[0].enrollmentNumber,
      modules: studentPeriod.matrixModule.Matrix.matrixModules.map(
        ({ disciplines, ...module }) => ({
          ...module,
          disciplines: disciplines.map(
            ({ attendanceLogs, studentGrades, ...discipline }) => ({
              ...discipline,
              status:
                studentGrades[0]?.finalValue === undefined ||
                studentGrades[0]?.period.status !== PeriodStatus.finished
                  ? StudentGradeStatus.pending
                  : studentGrades[0]?.finalValue >=
                    studentPeriod.matrixModule.Matrix.course.minPassingGrade
                  ? StudentGradeStatus.pass
                  : StudentGradeStatus.fail,
              totalAbsences: attendanceLogs
                .flatMap(({ studentAbsences }) =>
                  studentAbsences.map(({ totalAbsences }) => totalAbsences)
                )
                .reduce((a, b) => a + b, 0),
              finalGrade: studentGrades[0]?.finalValue ?? 0,
              grades:
                studentGrades[0]?.studentGradeItems.map((item) => ({
                  guid: item.guid,
                  name: item.gradeItem.name,
                  value: item.value,
                })) ?? [],
            })
          ),
        })
      ),
    };
  }

  async findStudentPeriodMatrix(studentGuid: string, periodGuid: string) {
    const studentPeriod = await prismaClient.period.findFirst({
      where: {
        guid: periodGuid,
        status: {
          not: PeriodStatus.canceled,
        },
        enrollments: {
          some: {
            studentGuid,
          },
        },
      },
      select: {
        matrixModule: {
          select: {
            Matrix: {
              select: {
                name: true,
                course: {
                  select: {
                    name: true,
                  },
                },
                matrixModules: {
                  select: {
                    guid: true,
                    name: true,
                    disciplines: {
                      select: {
                        guid: true,
                        name: true,
                        workload: true,
                        syllabus: true,
                      },
                    },
                  },
                  orderBy: {
                    createdAt: 'asc',
                  },
                },
              },
            },
          },
        },
      },
    });

    return {
      course: studentPeriod.matrixModule.Matrix.course.name,
      name: studentPeriod.matrixModule.Matrix.name,
      totalWorkload: studentPeriod.matrixModule.Matrix.matrixModules
        .flatMap(({ disciplines }) => disciplines)
        .reduce((a, b) => a + b.workload, 0),
      modules: studentPeriod.matrixModule.Matrix.matrixModules,
    };
  }

  async findStudentAvailableCourseCertificates(studentGuid: string) {
    const principal = await prismaClient.employee.findFirst({
      where: {
        roles: {
          some: {
            role: EmployeeRole.principal,
          },
        },
      },
      select: {
        name: true,
      },
    });

    const courses = await prismaClient.course.findMany({
      where: {
        enrollments: {
          some: {
            studentGuid,
          },
        },
        matrices: {
          some: {
            matrixModules: {
              every: {
                disciplines: {
                  every: {
                    studentGrades: {
                      some: {
                        studentGuid,
                        finalValue: {
                          gte: 6,
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
      select: {
        guid: true,
        name: true,
        enrollments: {
          where: {
            studentGuid,
          },
          select: {
            enrollmentNumber: true,
          },
        },
        matrices: {
          where: {
            matrixModules: {
              every: {
                disciplines: {
                  every: {
                    studentGrades: {
                      some: {
                        studentGuid,
                        finalValue: {
                          gte: 6,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          select: {
            matrixModules: {
              select: {
                disciplines: {
                  select: {
                    workload: true,
                  },
                },
                Period: {
                  where: { status: PeriodStatus.finished },
                  select: {
                    deadline: true,
                  },
                  orderBy: {
                    deadline: 'desc',
                  },
                },
              },
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
        },
      },
    });

    return courses.map(({ guid, name, enrollments, matrices }) => ({
      guid,
      name,
      enrollmentNumber: enrollments[0].enrollmentNumber,
      finishDate: matrices[0].matrixModules[0].Period[0]?.deadline,
      totalWorkload: matrices[0].matrixModules
        .flatMap(({ disciplines }) => disciplines)
        .reduce((a, b) => a + b.workload, 0),
      principalName: principal.name,
    }));
  }

  async findStudentSchedules(guid: string) {
    const periods = await prismaClient.period.findMany({
      where: {
        status: {
          notIn: [PeriodStatus.canceled, PeriodStatus.finished],
        },
        enrollments: {
          some: {
            studentGuid: guid,
          },
        },
      },
      select: {
        matrixModule: {
          select: {
            Matrix: {
              select: {
                course: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        disciplinesSchedule: {
          select: {
            Classroom: {
              select: {
                name: true,
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
            schedules: {
              select: {
                guid: true,
                classNumber: true,
                dayOfWeek: true,
                startTime: true,
                endTime: true,
                shift: {
                  select: {
                    shift: true,
                  },
                },
              },
              orderBy: {
                startTime: 'asc',
              },
            },
          },
        },
      },
    });

    const morningSchedules = periods.flatMap(
      ({ matrixModule, disciplinesSchedule }) => {
        return disciplinesSchedule.flatMap((schedule) =>
          schedule.schedules.some(({ shift }) => shift.shift === Shift.morning)
            ? {
                ...schedule,
                course: matrixModule.Matrix.course.name,
              }
            : []
        );
      }
    );

    const afternoonSchedules = periods.flatMap(
      ({ matrixModule, disciplinesSchedule }) => {
        return disciplinesSchedule.flatMap((schedule) =>
          schedule.schedules.some(
            ({ shift }) => shift.shift === Shift.afternoon
          )
            ? {
                ...schedule,
                course: matrixModule.Matrix.course.name,
              }
            : []
        );
      }
    );

    const eveningSchedules = periods.flatMap(
      ({ matrixModule, disciplinesSchedule }) => {
        return disciplinesSchedule.flatMap((schedule) =>
          schedule.schedules.some(({ shift }) => shift.shift === Shift.evening)
            ? {
                ...schedule,
                course: matrixModule.Matrix.course.name,
              }
            : []
        );
      }
    );

    const morning = allDaysOfWeek
      .map((day) => ({
        dayOfWeek: day,
        schedules: morningSchedules
          .flatMap(({ course, Classroom, schedules, Discipline, educator }) =>
            schedules.flatMap(
              ({
                classNumber,
                dayOfWeek,
                startTime,
                endTime,
                guid: scheduleGuid,
              }) => {
                if (dayOfWeek !== day) return [];

                return {
                  guid: scheduleGuid,
                  course,
                  classNumber,
                  classroom: Classroom.name,
                  discipline: Discipline.name,
                  educator: educator.name,
                  startTime,
                  endTime,
                };
              }
            )
          )
          .sort(compareClassSchedules),
      }))
      .filter(({ schedules }) => schedules.length > 0);

    const afternoon = allDaysOfWeek
      .map((day) => ({
        dayOfWeek: day,
        schedules: afternoonSchedules.flatMap(
          ({ course, Classroom, schedules, Discipline, educator }) =>
            schedules
              .flatMap(
                ({
                  classNumber,
                  dayOfWeek,
                  startTime,
                  endTime,
                  guid: scheduleGuid,
                }) => {
                  if (dayOfWeek !== day) return [];

                  return {
                    guid: scheduleGuid,
                    course,
                    classNumber,
                    classroom: Classroom.name,
                    discipline: Discipline.name,
                    educator: educator.name,
                    startTime,
                    endTime,
                  };
                }
              )
              .sort(compareClassSchedules)
        ),
      }))
      .filter(({ schedules }) => schedules.length > 0);

    const evening = allDaysOfWeek
      .map((day) => ({
        dayOfWeek: day,
        schedules: eveningSchedules.flatMap(
          ({ course, Classroom, schedules, Discipline, educator }) =>
            schedules
              .flatMap(
                ({
                  classNumber,
                  dayOfWeek,
                  startTime,
                  endTime,
                  guid: scheduleGuid,
                }) => {
                  if (dayOfWeek !== day) return [];

                  return {
                    guid: scheduleGuid,
                    course,
                    classNumber,
                    classroom: Classroom.name,
                    discipline: Discipline.name,
                    educator: educator.name,
                    startTime,
                    endTime,
                  };
                }
              )
              .sort(compareClassSchedules)
        ),
      }))
      .filter(({ schedules }) => schedules.length > 0);

    return {
      morning: morning.length > 0 ? morning : undefined,
      afternoon: afternoon.length > 0 ? afternoon : undefined,
      evening: evening.length > 0 ? evening : undefined,
    };
  }
}
