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
import { Address, Employee } from '../domains';
import {
  CreateEmployeeDTO,
  EmployeeRole,
  GenericStatus,
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
        equals: args?.filterByStatus,
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
    try {
      const employee = await prismaClient.employee.findUniqueOrThrow({
        where: { email },
        include: {
          roles: {
            select: {
              role: true,
            },
          },
        },
      });

      return { ...employee, roles: employee.roles.map((role) => role.role) };
    } catch {
      throw new AppError(ErrorMessages.MSGE02);
    }
  }

  async findByGuid(guid: string) {
    try {
      const employee = await prismaClient.employee.findUniqueOrThrow({
        where: { guid },
        include: {
          roles: {
            select: {
              role: true,
            },
          },
        },
      });

      return { ...employee, roles: employee.roles.map((role) => role.role) };
    } catch {
      throw new AppError(ErrorMessages.MSGE02);
    }
  }
}
