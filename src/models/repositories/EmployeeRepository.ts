import bcrypt from 'bcrypt';
import { excludeFields, generatePassword } from '../../helpers/utils';
import { AppError, ErrorMessages } from '../../infra/http/errors';
import { prismaClient } from '../../infra/prisma';
import { FindAllArgs, IRepository } from '../../interfaces';
import { MailProvider } from '../../providers/mail';
import { firstAccessEmailTemplate } from '../../providers/mail/templates';
import { Address, Employee } from '../domains';
import { CreateEmployeeDTO } from '../dtos';

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

  async update(guid: string, data: any) {
    throw new Error('Method not implemented.');
  }

  async findAll(args: FindAllArgs) {
    return {
      data: [],
      totalItems: 0,
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
    } catch (e) {
      throw new AppError(ErrorMessages.MSGE02);
    }
  }
}
