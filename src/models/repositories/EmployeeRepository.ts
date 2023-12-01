import bcrypt from 'bcrypt';
import {
  allDaysOfWeek,
  compareClassSchedules,
  excludeFields,
  generatePassword,
  parseArrayOfData,
} from '../../helpers/utils';
import { AppError, ErrorMessages } from '../../infra/http/errors';
import { prismaClient } from '../../infra/prisma';
import { FindAllArgs, IRepository } from '../../interfaces';
import { MailProvider } from '../../providers/mail';
import {
  firstAccessEmailTemplate,
  newPasswordEmailTemplate,
} from '../../providers/mail/templates';
import { Address, Employee } from '../domains';
import {
  CreateEmployeeDTO,
  EmployeeRole,
  GenericStatus,
  PeriodStatus,
  Shift,
  UpdateEmployeeDTO,
} from '../dtos';

export class EmployeeRepository implements IRepository {
  async create({
    address: addressData,
    birthdate,
    cpf,
    email,
    name,
    phoneNumber,
    roles,
  }: CreateEmployeeDTO) {
    const existingEmployee = await prismaClient.employee.findFirst({
      where: { OR: [{ cpf }, { email }] },
    });

    if (existingEmployee) {
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

    const employee = new Employee(
      roles,
      name,
      cpf,
      birthdate,
      phoneNumber,
      email,
      generatePassword(),
      address.toJSON()
    );

    employee.validate();

    const hashPassword = await bcrypt.hash(
      employee.password,
      Number(process.env.BCRYPT_SALT)
    );

    const createdEmployee = await prismaClient.employee.create({
      data: {
        name: employee.name,
        cpf: employee.cpf,
        birthdate: employee.birthdate,
        phoneNumber: employee.phoneNumber,
        email: employee.email,
        password: hashPassword,
        roles: {
          createMany: {
            data: employee.roles.map((role) => ({
              role,
            })),
          },
        },
        address: {
          create: {
            street: employee.address.street,
            number: employee.address.number,
            neighborhood: employee.address.neighborhood,
            city: employee.address.city,
            state: employee.address.state,
            cep: employee.address.cep,
          },
        },
      },
      include: {
        address: true,
        roles: {
          select: {
            role: true,
          },
        },
      },
    });

    const mailProvider = new MailProvider();

    await mailProvider.sendMail(
      employee.email,
      'Bem-vindo(a) ao Athena!',
      firstAccessEmailTemplate(employee.name, employee.email, employee.password)
    );

    const dataToReturn = {
      ...excludeFields(createdEmployee, [
        'createdAt',
        'updatedAt',
        'password',
        'addressGuid',
      ]),
      roles: createdEmployee.roles.map((role) => role.role),
      address: excludeFields(createdEmployee.address, [
        'createdAt',
        'updatedAt',
      ]),
    };

    return dataToReturn;
  }

  async update(guid: string, data: UpdateEmployeeDTO) {
    const employeeToUpdate = await prismaClient.employee.findUnique({
      where: { guid },
      include: {
        address: true,
        roles: {
          select: {
            role: true,
          },
        },
      },
    });

    if (!employeeToUpdate) {
      throw new AppError(ErrorMessages.MSGE05, 404);
    }

    const address = new Address(
      employeeToUpdate.address.street,
      employeeToUpdate.address.number,
      employeeToUpdate.address.neighborhood,
      employeeToUpdate.address.city,
      employeeToUpdate.address.state,
      employeeToUpdate.address.cep,
      employeeToUpdate.address.guid
    );

    if (data.address) {
      address.setAll(data.address);
      address.validate();
    }

    const employee = new Employee(
      employeeToUpdate.roles.map((role) => role.role) as EmployeeRole[],
      employeeToUpdate.name,
      employeeToUpdate.cpf,
      employeeToUpdate.birthdate.toISOString(),
      employeeToUpdate.phoneNumber,
      employeeToUpdate.email,
      employeeToUpdate.password,
      address.toJSON(),
      employeeToUpdate.status as GenericStatus,
      employeeToUpdate.guid
    );

    if (data.roles !== undefined) employee.roles = data.roles;
    if (data.name !== undefined) employee.name = data.name;
    if (data.cpf !== undefined) employee.cpf = data.cpf;
    if (data.birthdate !== undefined) employee.birthdate = data.birthdate;
    if (data.phoneNumber !== undefined) employee.phoneNumber = data.phoneNumber;
    if (data.email !== undefined) employee.email = data.email;
    if (data.password !== undefined) employee.password = data.password;
    if (data.status !== undefined) employee.status = data.status;

    employee.validate();

    if (employee.cpf !== employeeToUpdate.cpf) {
      const existingEmployee = await prismaClient.employee.findFirst({
        where: { cpf: employee.cpf },
      });

      if (existingEmployee) {
        throw new AppError(ErrorMessages.MSGE02);
      }
    }

    if (employee.email !== employeeToUpdate.email) {
      const existingEmployee = await prismaClient.employee.findFirst({
        where: { email: employee.email },
      });

      if (existingEmployee) {
        throw new AppError(ErrorMessages.MSGE02);
      }
    }

    const needsToUpdateRoles =
      JSON.stringify(employee.roles) !== JSON.stringify(employeeToUpdate.roles);

    if (needsToUpdateRoles) {
      await prismaClient.role.deleteMany({
        where: {
          employeeGuid: employeeToUpdate.guid,
        },
      });
    }

    let hashPassword: string;

    if (employee.password !== employeeToUpdate.password) {
      hashPassword = await bcrypt.hash(
        employee.password,
        Number(process.env.BCRYPT_SALT)
      );
    }

    const updatedEmployee = await prismaClient.employee.update({
      where: { guid },
      data: {
        status: employee.status,
        name: employee.name,
        cpf: employee.cpf,
        birthdate: employee.birthdate,
        phoneNumber: employee.phoneNumber,
        email: employee.email,
        password: hashPassword,
        roles: needsToUpdateRoles
          ? {
              createMany: {
                data: employee.roles.map((role) => ({
                  role,
                })),
              },
            }
          : undefined,
        address: {
          update: {
            ...address.toJSON(),
          },
        },
      },
      include: {
        address: true,
        roles: {
          select: {
            role: true,
          },
        },
      },
    });

    if (data.password) {
      const mailProvider = new MailProvider();

      await mailProvider.sendMail(
        employee.email,
        'Novos dados de acesso ao Athena',
        newPasswordEmailTemplate(
          employee.name,
          employee.email,
          employee.password
        )
      );
    }

    const dataToReturn = {
      ...excludeFields(updatedEmployee, [
        'createdAt',
        'updatedAt',
        'password',
        'addressGuid',
      ]),
      roles: updatedEmployee.roles.map((role) => role.role),
      address: excludeFields(updatedEmployee.address, [
        'createdAt',
        'updatedAt',
      ]),
    };

    return dataToReturn;
  }

  async findAll(args?: FindAllArgs & { role?: EmployeeRole }) {
    const where = {
      NOT:
        args?.itemsToExclude && !args.role
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
      roles: {
        some: {
          role: {
            in: args?.role,
          },
        },
      },
    };

    const totalItems = await prismaClient.employee.count({
      where,
    });

    const data = await prismaClient.employee.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: args?.skip,
      take: args?.take,
      include: {
        address: true,
        roles: {
          select: {
            role: true,
          },
        },
      },
    });

    const dataToUse = data.map((employee) => ({
      ...excludeFields(employee, [
        'createdAt',
        'updatedAt',
        'password',
        'addressGuid',
      ]),
      roles: employee.roles.map((role) => role.role),
      address: excludeFields(employee.address, ['createdAt', 'updatedAt']),
    }));

    return {
      data: dataToUse,
      totalItems,
    };
  }

  async findByEmail(email: string) {
    const employee = await prismaClient.employee.findUnique({
      where: { email },
      include: {
        roles: {
          select: {
            role: true,
          },
        },
      },
    });

    if (!employee) return undefined;

    return { ...employee, roles: employee.roles.map((role) => role.role) };
  }

  async findByGuid(guid: string) {
    const employee = await prismaClient.employee.findUnique({
      where: { guid },
      include: {
        roles: {
          select: {
            role: true,
          },
        },
      },
    });

    if (!employee) return undefined;

    return { ...employee, roles: employee.roles.map((role) => role.role) };
  }

  async findEmployeeSchedules(guid: string) {
    try {
      const employee = await prismaClient.employee.findUniqueOrThrow({
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
            },
          },
        },
      });

      return parseArrayOfData(
        employee.disciplinesSchedule.map((disciplineSchedule) => ({
          ...disciplineSchedule,
          disciplineName: disciplineSchedule.Discipline.name,
          employeeName: employee.name,
          schedules: parseArrayOfData(disciplineSchedule.schedules, [
            'createdAt',
            'updatedAt',
          ]),
        })),
        ['createdAt', 'updatedAt', 'Discipline']
      );
    } catch {
      throw new AppError(ErrorMessages.MSGE05, 404);
    }
  }

  async findEducatorSchedules(guid: string) {
    try {
      const educator = await prismaClient.employee.findUniqueOrThrow({
        where: { guid },
        select: {
          name: true,
          disciplinesSchedule: {
            select: {
              period: {
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
                },
              },
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

      const morningSchedules = educator.disciplinesSchedule.flatMap(
        (schedule) =>
          schedule.schedules.some(({ shift }) => shift.shift === Shift.morning)
            ? {
                ...schedule,
                course: schedule.period.matrixModule.Matrix.course.name,
              }
            : []
      );

      const afternoonSchedules = educator.disciplinesSchedule.flatMap(
        (schedule) =>
          schedule.schedules.some(({ shift }) => shift.shift === Shift.evening)
            ? {
                ...schedule,
                course: schedule.period.matrixModule.Matrix.course.name,
              }
            : []
      );

      const eveningSchedules = educator.disciplinesSchedule.flatMap(
        (schedule) =>
          schedule.schedules.some(({ shift }) => shift.shift === Shift.evening)
            ? {
                ...schedule,
                course: schedule.period.matrixModule.Matrix.course.name,
              }
            : []
      );

      const morning = allDaysOfWeek
        .map((day) => ({
          dayOfWeek: day,
          schedules: morningSchedules
            .flatMap(({ course, Classroom, schedules, Discipline }) =>
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
          schedules: afternoonSchedules
            .flatMap(({ course, Classroom, schedules, Discipline }) =>
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

      const evening = allDaysOfWeek
        .map((day) => ({
          dayOfWeek: day,
          schedules: eveningSchedules
            .flatMap(({ course, Classroom, schedules, Discipline }) =>
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

      return {
        morning: morning.length > 0 ? morning : undefined,
        afternoon: afternoon.length > 0 ? afternoon : undefined,
        evening: evening.length > 0 ? evening : undefined,
      };
    } catch {
      throw new AppError(ErrorMessages.MSGE05, 404);
    }
  }

  async findEmployeePeriods(guid: string) {
    const employeePeriods = await prismaClient.period.findMany({
      where: {
        status: PeriodStatus.inProgress,
        disciplinesSchedule: {
          some: {
            employeeGuid: guid,
          },
        },
      },
      select: {
        guid: true,
        classId: true,
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

    return employeePeriods.map((period) => ({
      guid: period.guid,
      name: `${period.matrixModule.Matrix.course.name}/${period.matrixModule.Matrix.name} - ${period.matrixModule.name} (Turma ${period.classId})`,
      disciplines: period.matrixModule.disciplines,
    }));
  }

  async findEmployeeDisciplinesByPeriod(
    employeeGuid: string,
    periodGuid: string
  ) {
    const employeePeriods = await prismaClient.period.findMany({
      where: {
        status: PeriodStatus.inProgress,
        guid: periodGuid,
        disciplinesSchedule: {
          some: {
            employeeGuid,
          },
        },
      },
      select: {
        matrixModule: {
          select: {
            disciplines: {
              select: {
                guid: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return employeePeriods.flatMap(({ matrixModule }) =>
      matrixModule.disciplines.map((discipline) => ({
        guid: discipline.guid,
        name: discipline.name,
      }))
    );
  }
}
