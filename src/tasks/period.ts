import dayjs from 'dayjs';
import cron from 'node-cron';
import { prismaClient } from '../infra/prisma';
import { PeriodStatus } from '../models/dtos';

export const updatePeriodStatusTask = cron.schedule(
  '0 0 * * *',
  async () => {
    const periodsOpenedForEnrollment = await prismaClient.period.findMany({
      where: {
        NOT: {
          status: PeriodStatus.draft,
        },
        enrollmentStartDate: {
          gte: dayjs()
            .set('hour', 0)
            .set('minute', 0)
            .set('second', 0)
            .toISOString(),
          lte: dayjs()
            .set('hour', 23)
            .set('minute', 59)
            .set('second', 59)
            .toISOString(),
        },
      },
    });

    const periodsInProgress = await prismaClient.period.findMany({
      where: {
        NOT: {
          status: PeriodStatus.draft,
        },
        enrollmentEndDate: {
          gte: dayjs()
            .set('hour', 0)
            .set('minute', 0)
            .set('second', 0)
            .toISOString(),
          lte: dayjs()
            .set('hour', 23)
            .set('minute', 59)
            .set('second', 59)
            .toISOString(),
        },
      },
    });

    const finishedPeriods = await prismaClient.period.findMany({
      where: {
        NOT: {
          status: PeriodStatus.draft,
        },
        enrollmentEndDate: {
          gte: dayjs()
            .set('hour', 0)
            .set('minute', 0)
            .set('second', 0)
            .toISOString(),
          lte: dayjs()
            .set('hour', 23)
            .set('minute', 59)
            .set('second', 59)
            .toISOString(),
        },
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
