import bcrypt from 'bcrypt';
import { EmployeeRole, Shift } from '../../models/dtos';
import { prismaClient } from '.';

async function createShifts() {
  const morning = await prismaClient.shift.findFirst({
    where: {
      shift: Shift.morning,
    },
  });
  const afternoon = await prismaClient.shift.findFirst({
    where: {
      shift: Shift.afternoon,
    },
  });
  const evening = await prismaClient.shift.findFirst({
    where: {
      shift: Shift.evening,
    },
  });

  if (!morning) {
    await prismaClient.shift.create({
      data: {
        shift: Shift.morning,
      },
    });
  }

  if (!afternoon) {
    await prismaClient.shift.create({
      data: {
        shift: Shift.afternoon,
      },
    });
  }

  if (!evening) {
    await prismaClient.shift.create({
      data: {
        shift: Shift.evening,
      },
    });
  }
}

async function createAdmin() {
  const admin = await prismaClient.employee.findUnique({
    where: { cpf: '00000000000' },
  });

  const hashPassword = await bcrypt.hash(
    'admin123',
    Number(process.env.BCRYPT_SALT)
  );

  if (admin) {
    await prismaClient.employee.update({
      where: { cpf: '00000000000' },
      data: {
        name: 'Admin',
        email: 'admin@admin.com',
        password: hashPassword,
      },
    });

    return;
  }

  await prismaClient.employee.create({
    data: {
      name: 'Admin',
      cpf: '00000000000',
      birthdate: new Date().toISOString(),
      phoneNumber: '00000000000',
      email: 'admin@admin.com',
      password: hashPassword,
      roles: {
        createMany: {
          data: [
            { role: EmployeeRole.principal },
            { role: EmployeeRole.educator },
          ],
        },
      },
      address: {
        create: {
          street: 'Rua',
          number: '123',
          neighborhood: 'Bairro',
          city: 'Cidade',
          state: 'UF',
          cep: '00000000',
        },
      },
    },
  });
}

async function createStudent() {
  const student = await prismaClient.student.findUnique({
    where: { cpf: '00000000000' },
  });

  const hashPassword = await bcrypt.hash(
    '12345678',
    Number(process.env.BCRYPT_SALT)
  );

  if (student) {
    await prismaClient.student.update({
      where: { cpf: '00000000000' },
      data: {
        name: 'John Doe',
        email: 'student@student.com',
        password: hashPassword,
      },
    });

    return;
  }

  await prismaClient.student.create({
    data: {
      name: 'John Doe',
      cpf: '00000000000',
      birthdate: new Date().toISOString(),
      phoneNumber: '00000000000',
      email: 'student@student.com',
      password: hashPassword,
      address: {
        create: {
          street: 'Rua',
          number: '123',
          neighborhood: 'Bairro',
          city: 'Cidade',
          state: 'UF',
          cep: '00000000',
        },
      },
    },
  });
}

async function seed() {
  await createAdmin();
  await createStudent();
  await createShifts();
}

seed();
