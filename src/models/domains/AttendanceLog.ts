import { z } from 'zod';
import { AppError, ErrorMessages } from '../../infra/http/errors';
import { StudentAbsenceDTO } from '../dtos/attendanceLog';

export class AttendanceLog {
  constructor(
    private _periodGuid: string,
    private _disciplineGuid: string,
    private _classDate: string,
    private _totalClasses: number,
    private _studentAbsences: StudentAbsenceDTO[],
    private _guid?: string
  ) {}

  get periodGuid() {
    return this._periodGuid;
  }

  set periodGuid(periodGuid: string) {
    this._periodGuid = periodGuid;
  }

  get disciplineGuid() {
    return this._disciplineGuid;
  }

  set disciplineGuid(disciplineGuid: string) {
    this._disciplineGuid = disciplineGuid;
  }

  get classDate() {
    return this._classDate;
  }

  set classDate(classDate: string) {
    this._classDate = classDate;
  }

  get totalClasses() {
    return this._totalClasses;
  }

  set totalClasses(totalClasses: number) {
    this._totalClasses = totalClasses;
  }

  get studentAbsences() {
    return this._studentAbsences;
  }

  set studentAbsences(studentAbsences: StudentAbsenceDTO[]) {
    this._studentAbsences = studentAbsences;
  }

  get guid() {
    return this._guid;
  }

  set guid(guid: string) {
    this._guid = guid;
  }

  toJSON() {
    return {
      periodGuid: this.periodGuid,
      disciplineGuid: this.disciplineGuid,
      classDate: this.classDate,
      totalClasses: this.totalClasses,
      guid: this.guid,
    };
  }

  validate() {
    const courseSchema = z
      .object({
        guid: z.string().uuid('Guid inválido'),
        periodGuid: z.string().uuid('Guid inválido'),
        disciplineGuid: z.string().uuid('Guid inválido'),
        classDate: z
          .string({ required_error: ErrorMessages.MSGE01 })
          .datetime({ message: ErrorMessages.MSGE06 }),
        totalClasses: z
          .number({ required_error: ErrorMessages.MSGE01 })
          .min(1, ErrorMessages.MSGE10),
        studentAbsences: z.array(
          z.object({
            studentGuid: z.string().uuid('Guid inválido'),
            totalAbsences: z
              .number({ required_error: ErrorMessages.MSGE01 })
              .min(0, ErrorMessages.MSGE10),
          })
        ),
      })
      .partial({ guid: true });

    try {
      courseSchema.parse(this);
    } catch (err) {
      throw new AppError(err.issues[0].message);
    }
  }
}
