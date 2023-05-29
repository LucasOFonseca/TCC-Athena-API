import { Shift } from '../../models/dtos';
import { prismaClient } from '.';

async function seed() {
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

seed();
