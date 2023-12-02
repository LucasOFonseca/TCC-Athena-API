import dayjs from 'dayjs';
import { z } from 'zod';
import { AppError, ErrorMessages } from '../../infra/http/errors';
import { PeriodStatus } from '../dtos';
import { DisciplineSchedule } from '.';

interface Partial {
  [key: string]: true;
}

export class Period {
  private DEFAULT_VALIDATION_PARTIAL_MARK: Partial = {
    guid: true,
    status: true,
  };
  private DRAFT_VALIDATION_PARTIAL_MARK: Partial = {
    guid: true,
    status: true,
    classId: true,
    classroomGuid: true,
    deadline: true,
    disciplinesSchedule: true,
    enrollmentEndDate: true,
    enrollmentStartDate: true,
    shiftGuid: true,
    vacancies: true,
  };

  constructor(
    private _matrixModuleGuid: string,
    private _enrollmentStartDate?: string,
    private _enrollmentEndDate?: string,
    private _deadline?: string,
    private _vacancies?: number,
    private _classroomGuid?: string,
    private _shiftGuid?: string,
    private _classId?: string,
    private _disciplinesSchedule?: DisciplineSchedule[],
    private _status?: PeriodStatus,
    private _guid?: string
  ) {}

  get enrollmentStartDate() {
    return this._enrollmentStartDate;
  }

  set enrollmentStartDate(enrollmentStartDate: string) {
    this._enrollmentStartDate = enrollmentStartDate;
  }

  get enrollmentEndDate() {
    return this._enrollmentEndDate;
  }

  set enrollmentEndDate(enrollmentEndDate: string) {
    this._enrollmentEndDate = enrollmentEndDate;
  }

  get deadline() {
    return this._deadline;
  }

  set deadline(deadline: string) {
    this._deadline = deadline;
  }

  get vacancies() {
    return this._vacancies;
  }

  set vacancies(vacancies: number) {
    this._vacancies = vacancies;
  }

  get classroomGuid() {
    return this._classroomGuid;
  }

  set classroomGuid(classroomGuid: string) {
    this._classroomGuid = classroomGuid;
  }

  get shiftGuid() {
    return this._shiftGuid;
  }

  set shiftGuid(shiftGuid: string) {
    this._shiftGuid = shiftGuid;
  }

  get matrixModuleGuid() {
    return this._matrixModuleGuid;
  }

  set matrixModuleGuid(matrixModuleGuid: string) {
    this._matrixModuleGuid = matrixModuleGuid;
  }

  get classId() {
    return this._classId;
  }

  set classId(classId: string) {
    this._classId = classId;
  }

  get disciplinesSchedule() {
    return this._disciplinesSchedule;
  }

  set disciplinesSchedule(disciplinesSchedule: DisciplineSchedule[]) {
    this._disciplinesSchedule = disciplinesSchedule;
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

  set status(status: PeriodStatus) {
    this._status = status;
  }

  toJSON() {
    return {
      guid: this._guid,
      status: this._status,
      enrollmentStartDate: this._enrollmentStartDate,
      enrollmentEndDate: this._enrollmentEndDate,
      deadline: this._deadline,
      vacancies: this._vacancies,
      classroomGuid: this._classroomGuid,
      shiftGuid: this._shiftGuid,
      matrixModuleGuid: this._matrixModuleGuid,
      classId: this._classId,
      disciplinesSchedule: this._disciplinesSchedule,
    };
  }

  validate() {
    const periodSchema = z
      .object({
        guid: z.string().uuid('Guid inválido'),
        status: z.enum(
          [
            PeriodStatus.canceled,
            PeriodStatus.finished,
            PeriodStatus.inProgress,
            PeriodStatus.notStarted,
            PeriodStatus.openForEnrollment,
            PeriodStatus.draft,
          ],
          {
            errorMap: () => new AppError(ErrorMessages.MSGE06),
          }
        ),
        enrollmentStartDate: z
          .string({ required_error: ErrorMessages.MSGE01 })
          .superRefine((enrollmentEndDate, ctx) => {
            const isLaterThanEnrollmentEndDate = dayjs(
              enrollmentEndDate
            ).isAfter(dayjs(this.enrollmentEndDate), 'day');

            if (isLaterThanEnrollmentEndDate) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: ErrorMessages.MSGE11,
              });
            }
          }),
        enrollmentEndDate: z
          .string({ required_error: ErrorMessages.MSGE01 })
          .superRefine((enrollmentStartDate, ctx) => {
            const isEarlierThanEnrollmentStartDate = dayjs(
              enrollmentStartDate
            ).isBefore(dayjs(this.enrollmentStartDate), 'day');

            if (isEarlierThanEnrollmentStartDate) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: ErrorMessages.MSGE10,
              });
            }
          }),
        deadline: z
          .string({ required_error: ErrorMessages.MSGE01 })
          .superRefine((deadline, ctx) => {
            const isEarlierThanEnrollmentEndDate = dayjs(deadline).isBefore(
              dayjs(this.enrollmentEndDate),
              'day'
            );

            if (isEarlierThanEnrollmentEndDate) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: ErrorMessages.MSGE10,
              });
            }
          }),
        vacancies: z
          .number({ required_error: ErrorMessages.MSGE01 })
          .min(1, ErrorMessages.MSGE10)
          .max(100, ErrorMessages.MSGE11),
        classroomGuid: z.string({ required_error: ErrorMessages.MSGE01 }),
        shiftGuid: z.string({ required_error: ErrorMessages.MSGE01 }),
        matrixModuleGuid: z.string({ required_error: ErrorMessages.MSGE01 }),
        classId: z.string({ required_error: ErrorMessages.MSGE01 }),
        disciplinesSchedule: z.array(z.any()),
      })
      .partial(
        this._status === PeriodStatus.draft
          ? this.DRAFT_VALIDATION_PARTIAL_MARK
          : this.DEFAULT_VALIDATION_PARTIAL_MARK
      );

    try {
      periodSchema.parse(this);
    } catch (err) {
      throw new AppError(err.issues[0].message);
    }
  }
}
