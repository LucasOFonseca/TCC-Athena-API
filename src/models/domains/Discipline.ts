import { z } from 'zod';
import { AppError, ErrorMessages } from '../../infra/http/errors';
import { GenericStatus } from '../dtos';

export class Discipline {
  constructor(
    private _name: string,
    private _syllabus: string,
    private _workload: number,
    private _weeklyClasses: number,
    private _guid?: string,
    private _status?: GenericStatus
  ) {}

  get name() {
    return this._name;
  }

  set name(name: string) {
    this._name = name;
  }

  get syllabus() {
    return this._syllabus;
  }

  set syllabus(syllabus: string) {
    this._syllabus = syllabus;
  }

  get workload() {
    return this._workload;
  }

  set workload(workload: number) {
    this._workload = workload;
  }

  get weeklyClasses() {
    return this._weeklyClasses;
  }

  set weeklyClasses(weeklyClasses: number) {
    this._weeklyClasses = weeklyClasses;
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
      name: this.name,
      syllabus: this.syllabus,
      workload: this.workload,
      weeklyClasses: this.weeklyClasses,
      guid: this.guid,
      status: this.status,
    };
  }

  validate() {
    const disciplineSchema = z
      .object({
        guid: z.string().uuid('Guid inválido'),
        status: z.enum([GenericStatus.active, GenericStatus.inactive], {
          errorMap: () => new AppError(ErrorMessages.MSGE06),
        }),
        name: z
          .string({ required_error: ErrorMessages.MSGE01 })
          .min(3, ErrorMessages.MSGE08)
          .max(120, ErrorMessages.MSGE09),
        syllabus: z
          .string({ required_error: ErrorMessages.MSGE01 })
          .min(3, ErrorMessages.MSGE08)
          .max(500, ErrorMessages.MSGE09),
        workload: z
          .number({
            required_error: ErrorMessages.MSGE01,
          })
          .min(1, ErrorMessages.MSGE10)
          .max(999, ErrorMessages.MSGE11),
        weeklyClasses: z
          .number({ required_error: ErrorMessages.MSGE01 })
          .min(1, ErrorMessages.MSGE10)
          .max(35, ErrorMessages.MSGE11),
      })
      .partial({ guid: true, status: true });

    try {
      disciplineSchema.parse(this);
    } catch (err) {
      throw new AppError(err.issues[0].message);
    }
  }
}
