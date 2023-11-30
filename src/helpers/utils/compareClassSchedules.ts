export const compareClassSchedules = (
  classScheduleA: any,
  classScheduleB: any
) => {
  if (classScheduleA.startTime < classScheduleB.startTime) return -1;

  if (classScheduleA.startTime > classScheduleB.startTime) return 1;

  return 0;
};
