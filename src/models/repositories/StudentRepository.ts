import bcrypt from 'bcrypt';
import { excludeFields, generatePassword } from '../../helpers/utils';
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
  GenericStatus,
  PeriodStatus,
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
          not: PeriodStatus.canceled,
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
                  },
                },
              },
            },
            disciplines: {
              select: {
                guid: true,
                name: true,
                attendanceLogs: {
                  where: {
                    periodGuid,
                    studentAbsences: {
                      some: {
                        studentGuid,
                      },
                    },
                  },
                  select: {
                    studentAbsences: {
                      select: {
                        totalAbsences: true,
                      },
                    },
                  },
                },
                studentGrades: {
                  where: {
                    studentGuid,
                    periodGuid,
                  },
                  select: {
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
        },
      },
    });

    return {
      guid: studentPeriod.guid,
      classId: studentPeriod.classId,
      course: studentPeriod.matrixModule.Matrix.course.name,
      matrix: studentPeriod.matrixModule.Matrix.name,
      module: studentPeriod.matrixModule.name,
      classesStartDate: studentPeriod.enrollmentEndDate,
      deadline: studentPeriod.deadline,
      enrollmentNumber: studentPeriod.enrollments[0].enrollmentNumber,
      disciplines: studentPeriod.matrixModule.disciplines.map(
        ({ guid, name, attendanceLogs, studentGrades }) => ({
          guid,
          name,
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
      finishDate: matrices[0].matrixModules[0].Period[0].deadline,
      totalWorkload: matrices[0].matrixModules
        .flatMap(({ disciplines }) => disciplines)
        .reduce((a, b) => a + b.workload, 0),
    }));
  }
}
