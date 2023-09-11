import { DisciplineSchedule } from '..';
import { AppError, ErrorMessages } from '../../../infra/http/errors';
import { prismaClient } from '../../../infra/prisma';
import {
  DisciplineDTO,
  DisciplineScheduleDTO,
  EmployeeRole,
  GenericStatus,
} from '../../dtos';

export class PeriodValidator {
  checkScheduleAvailability(
    objectSchedules: DisciplineScheduleDTO[],
    disciplinesSchedule: DisciplineScheduleDTO[]
  ) {
    let isAvailable = true;

    objectSchedules.forEach(({ schedules }) => {
      isAvailable = !disciplinesSchedule.every(
        ({ schedules: dataSchedules }) => {
          return !dataSchedules.every((schedule) =>
            schedules.some((s) => s.guid === schedule.guid)
          );
        }
      );
    });

    return isAvailable;
  }

  async checkIfPeriodExists(classId: string, matrixModuleGuid: string) {
    const existingPeriod = await prismaClient.period.findFirst({
      where: { classId, matrixModuleGuid },
    });

    if (existingPeriod) throw new AppError(ErrorMessages.MSGE02);
  }

  async checkClassroomAvailability(
    classroomGuid: string,
    shiftGuid: string,
    vacancies: number,
    disciplinesSchedule?: DisciplineSchedule[]
  ) {
    const selectedClassroom = await prismaClient.classroom.findUnique({
      where: { guid: classroomGuid },
      include: {
        disciplinesSchedule: {
          include: {
            schedules: true,
          },
          where: {
            schedules: {
              some: {
                shiftGuid,
              },
            },
          },
        },
      },
    });

    if (!selectedClassroom) throw new AppError(ErrorMessages.MSGE05, 404);

    if (selectedClassroom.status === GenericStatus.inactive)
      throw new AppError(ErrorMessages.MSGE16, 404);

    if (selectedClassroom.capacity < vacancies)
      throw new AppError(ErrorMessages.MSGE06);

    if (
      selectedClassroom.disciplinesSchedule.length !== 0 &&
      disciplinesSchedule
    ) {
      const isClassroomAvailable = this.checkScheduleAvailability(
        selectedClassroom.disciplinesSchedule as unknown as DisciplineScheduleDTO[],
        disciplinesSchedule
      );

      if (!isClassroomAvailable) throw new AppError(ErrorMessages.MSGE16);
    }
  }

  async checkShiftAvailability(shiftGuid: string) {
    const selectedShift = await prismaClient.shift.findUnique({
      where: { guid: shiftGuid },
    });

    if (selectedShift.status === GenericStatus.inactive)
      throw new AppError(ErrorMessages.MSGE16, 404);
  }

  async checkEmployeeAvailability(
    employeeGuid: string,
    disciplinesSchedule: DisciplineSchedule[]
  ) {
    const employee = await prismaClient.employee.findUnique({
      where: { guid: employeeGuid },
      include: {
        roles: {
          select: {
            role: true,
          },
        },
        disciplinesSchedule: {
          include: {
            schedules: true,
          },
        },
      },
    });

    if (!employee) throw new AppError(ErrorMessages.MSGE05, 404);

    if (employee.status === GenericStatus.inactive)
      throw new AppError(ErrorMessages.MSGE16, 404);

    if (!employee.roles.some((role) => role.role === EmployeeRole.educator)) {
      throw new AppError(ErrorMessages.MSGE06);
    }

    if (employee.disciplinesSchedule.length > 0) {
      const isEmployeeAvailable = this.checkScheduleAvailability(
        employee.disciplinesSchedule as unknown as DisciplineScheduleDTO[],
        disciplinesSchedule
      );

      if (!isEmployeeAvailable) throw new AppError(ErrorMessages.MSGE16);
    }
  }

  async validateDisciplinesSchedule(
    disciplines: DisciplineDTO[],
    disciplinesSchedule: DisciplineSchedule[],
    shiftGuid: string
  ) {
    const isDisciplinesScheduleValid =
      disciplines.every((discipline) => {
        const isNotDuplicated =
          disciplinesSchedule.filter(
            (disciplineSchedule) =>
              discipline.guid === disciplineSchedule.disciplineGuid
          ).length === 1;

        const disciplineSchedule = disciplinesSchedule.find(
          (schedule) => schedule.disciplineGuid === discipline.guid
        );

        if (!disciplineSchedule) return false;

        const hasEnoughClasses =
          disciplineSchedule.schedules.length === discipline.weeklyClasses;

        return isNotDuplicated && hasEnoughClasses;
      }) && disciplinesSchedule.length === disciplines.length;

    const hasSchedulesWithWrongShift = disciplinesSchedule.some(
      ({ schedules }) => schedules.some((s) => s.shiftGuid !== shiftGuid)
    );

    if (!isDisciplinesScheduleValid || hasSchedulesWithWrongShift)
      throw new AppError(ErrorMessages.MSGE06);

    const allSelectedEmployeesGuidList = disciplinesSchedule
      .map(({ employeeGuid }) => employeeGuid)
      .filter((guid, index, array) => array.indexOf(guid) === index);

    // eslint-disable-next-line no-restricted-syntax
    for await (const employeeGuid of allSelectedEmployeesGuidList) {
      await this.checkEmployeeAvailability(employeeGuid, disciplinesSchedule);
    }
  }
}
