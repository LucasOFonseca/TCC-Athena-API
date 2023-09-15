import cron from 'node-cron';
import { prismaClient } from '../infra/prisma';
import { PeriodStatus } from '../models/dtos';

export const updatePeriodStatusTask = cron.schedule(
  '0 0 * * *',
  async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const periodsOpenedForEnrollment = await prismaClient.period.findMany({
      where: {
        AND: [
          {
            status: PeriodStatus.notStarted,
          },
          {
            enrollmentStartDate: {
              equals: today,
            },
          },
        ],
      },
    });

    const periodsInProgress = await prismaClient.period.findMany({
      where: {
        AND: [
          {
            status: PeriodStatus.openForEnrollment,
          },
          {
            enrollmentEndDate: {
              equals: today,
            },
          },
        ],
      },
    });

    const finishedPeriods = await prismaClient.period.findMany({
      where: {
        AND: [
          {
            status: PeriodStatus.inProgress,
          },
          {
            deadline: {
              equals: today,
            },
          },
        ],
      },
    });

    if (periodsOpenedForEnrollment.length > 0) {
      await prismaClient.period.updateMany({
        where: {
          guid: {
            in: periodsOpenedForEnrollment.map((p) => p.guid),
          },
        },
        data: {
          status: PeriodStatus.openForEnrollment,
        },
      });
    }

    if (periodsInProgress.length > 0) {
      await prismaClient.period.updateMany({
        where: {
          guid: {
            in: periodsInProgress.map((p) => p.guid),
          },
        },
        data: {
          status: PeriodStatus.inProgress,
        },
      });
    }

    if (finishedPeriods.length > 0) {
      await prismaClient.period.updateMany({
        where: {
          guid: {
            in: finishedPeriods.map((p) => p.guid),
          },
        },
        data: {
          status: PeriodStatus.finished,
        },
      });
    }
  },
  {
    timezone: 'America/Sao_Paulo',
  }
);
