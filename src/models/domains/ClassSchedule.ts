import dayjs from 'dayjs';
import { z } from 'zod';
import { AppError, ErrorMessages } from '../../infra/http/errors';
import { DayOfWeek, GenericStatus } from '../dtos';

export class ClassSchedule {
  constructor(
    private _shiftGuid: string,
    private _dayOfWeek: DayOfWeek,
    private _classNumber: number,
    private _startTime: string,
    private _endTime: string,
    private _guid?: string,
    private _status?: GenericStatus
  ) {}

  get shiftGuid() {
    return this._shiftGuid;
  }

  set shiftGuid(shiftGuid: string) {
    this._shiftGuid = shiftGuid;
  }

  get dayOfWeek() {
    return this._dayOfWeek;
  }

  set dayOfWeek(dayOfWeek: DayOfWeek) {
    this._dayOfWeek = dayOfWeek;
  }

  get classNumber() {
    return this._classNumber;
  }

  set classNumber(classNumber: number) {
    this._classNumber = classNumber;
  }

  get startTime() {
    return this._startTime;
  }

  set startTime(startTime: string) {
    this._startTime = startTime;
  }

  get endTime() {
    return this._endTime;
  }

  set endTime(endTime: string) {
    this._endTime = endTime;
  }

  get guid() {
    return this._guid;
  }

  set guid(guid: string) {
    this._guid = guid;
  }

  get status() {
    return this._status;
  }

  set status(status: GenericStatus) {
    this._status = status;
  }

  toJSON() {
    return {
      shiftGuid: this.shiftGuid,
      classNumber: this.classNumber,
      dayOfWeek: this.dayOfWeek,
      startTime: this.startTime,
      endTime: this.endTime,
      guid: this.guid,
      status: this.status,
    };
  }

  validate() {
    const classScheduleSchema = z
      .object({
        guid: z.string().uuid('Guid inválido'),
        shiftGuid: z.string().uuid('Guid inválido'),
        dayOfWeek: z.enum(
          [
            DayOfWeek.monday,
            DayOfWeek.tuesday,
            DayOfWeek.wednesday,
            DayOfWeek.thursday,
            DayOfWeek.friday,
            DayOfWeek.saturday,
            DayOfWeek.sunday,
          ],
          {
            errorMap: () => new AppError(ErrorMessages.MSGE06),
          }
        ),
        classNumber: z
          .number()
          .min(1, {
            message: ErrorMessages.MSGE10,
          })
          .max(6, {
            message: ErrorMessages.MSGE11,
          }),
        startTime: z
          .string({ required_error: ErrorMessages.MSGE01 })
          .superRefine((startTime, ctx) => {
            const isLaterThanEndTime = dayjs(startTime)
              .set('year', 1970)
              .set('month', 0)
              .set('date', 1)
              .isAfter(
                dayjs(this.endTime)
                  .set('year', 1970)
                  .set('month', 0)
                  .set('date', 1),
                'minute'
              );

            if (isLaterThanEndTime) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: ErrorMessages.MSGE11,
              });
            }
          }),
        endTime: z
          .string({ required_error: ErrorMessages.MSGE01 })
          .superRefine((endTime, ctx) => {
            const isEarlierThanStartTime = dayjs(endTime)
              .set('year', 1970)
              .set('month', 0)
              .set('day', 1)
              .isBefore(
                dayjs(this.startTime)
                  .set('year', 1970)
                  .set('month', 0)
                  .set('day', 1),
                'minute'
              );

            if (isEarlierThanStartTime) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: ErrorMessages.MSGE10,
              });
            }
          }),
      })
      .partial({ guid: true, status: true });

    try {
      classScheduleSchema.parse(this);
    } catch (err) {
      throw new AppError(err.issues[0].message);
    }
  }
}
