import { DisciplineScheduleDTO } from '../../dtos';

export function checkScheduleAvailability(
  objectSchedules: DisciplineScheduleDTO[],
  disciplinesSchedule: DisciplineScheduleDTO[]
) {
  let isAvailable = true;

  objectSchedules.forEach(({ schedules }) => {
    isAvailable = !disciplinesSchedule.every(({ schedules: dataSchedules }) => {
      return !dataSchedules.every((schedule) =>
        schedules.some((s) => s.guid === schedule.guid)
      );
    });
  });

  return isAvailable;
}
