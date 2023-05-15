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
import { CreateStudentDTO, GenericStatus, UpdateStudentDTO } from '../dtos';

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
        equals: args?.filterByStatus,
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
      throw new AppError(ErrorMessages.MSGE02);
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
}
