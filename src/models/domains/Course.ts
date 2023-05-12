import { z } from 'zod';
import { AppError, ErrorMessages } from '../../infra/http/errors';
import { GenericStatus } from '../dtos';

export class Course {
  constructor(
    private _name: string,
    private _guid?: string,
    private _status?: GenericStatus
  ) {}

  get name() {
    return this._name;
  }

  set name(name: string) {
    this._name = name;
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
      guid: this.guid,
      status: this.status,
    };
  }

  validate() {
    const courseSchema = z
      .object({
        guid: z.string().uuid('Guid inválido'),
        status: z.enum([GenericStatus.active, GenericStatus.inactive], {
          errorMap: () => new AppError(ErrorMessages.MSGE06),
        }),
        name: z
          .string({ required_error: ErrorMessages.MSGE01 })
          .min(3, ErrorMessages.MSGE08)
          .max(120, ErrorMessages.MSGE09),
      })
      .partial({ guid: true, status: true });

    try {
      courseSchema.parse(this);
    } catch (err) {
      throw new AppError(err.issues[0].message);
    }
  }
}
