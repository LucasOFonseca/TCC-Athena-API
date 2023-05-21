import { z } from 'zod';
import { AppError, ErrorMessages } from '../../infra/http/errors';
import { GenericStatus, MatrixModuleDTO } from '../dtos';

export class Matrix {
  constructor(
    private _name: string,
    private _courseGuid: string,
    private _modules: MatrixModuleDTO[],
    private _status?: GenericStatus,
    private _guid?: string
  ) {}

  get name(): string {
    return this._name;
  }

  set name(value: string) {
    this._name = value;
  }

  get courseGuid(): string {
    return this._courseGuid;
  }

  set courseGuid(value: string) {
    this._courseGuid = value;
  }

  get modules(): MatrixModuleDTO[] {
    return this._modules;
  }

  set modules(value: MatrixModuleDTO[]) {
    this._modules = value;
  }

  get status(): GenericStatus {
    return this._status;
  }

  set status(value: GenericStatus) {
    this._status = value;
  }

  get guid(): string {
    return this._guid;
  }

  set guid(value: string) {
    this._guid = value;
  }

  toJSON() {
    return {
      guid: this.guid,
      status: this.status,
      name: this.name,
      courseGuid: this.courseGuid,
      modules: this.modules,
    };
  }

  validate() {
    const matrixModuleSchema = z
      .object({
        guid: z.string().uuid('Guid inválido'),
        name: z
          .string({ required_error: ErrorMessages.MSGE01 })
          .min(3, ErrorMessages.MSGE08)
          .max(120, ErrorMessages.MSGE09),
        disciplines: z
          .array(z.string().uuid('Guid inválido'))
          .superRefine((disciplines, ctx) => {
            if (disciplines.length < 1) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: ErrorMessages.MSGE01,
              });
            }

            if (disciplines.length !== new Set(disciplines).size) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: ErrorMessages.MSGE15,
              });
            }
          }),
      })
      .partial({ guid: true });

    const matrixSchema = z
      .object({
        guid: z.string().uuid('Guid inválido'),
        status: z.enum([GenericStatus.active, GenericStatus.inactive], {
          errorMap: () => new AppError(ErrorMessages.MSGE06),
        }),
        name: z
          .string({ required_error: ErrorMessages.MSGE01 })
          .min(3, ErrorMessages.MSGE08)
          .max(120, ErrorMessages.MSGE09),
        courseGuid: z.string().uuid('Guid inválido'),
        modules: z.array(matrixModuleSchema).superRefine((modules, ctx) => {
          if (modules.length < 1) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: ErrorMessages.MSGE01,
            });
          }

          const moduleNames = modules.map((module) => module.name);

          if (moduleNames.length !== new Set(moduleNames).size) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: ErrorMessages.MSGE15,
            });
          }
        }),
      })
      .partial({ guid: true, status: true });
    try {
      matrixSchema.parse(this);
    } catch (err) {
      throw new AppError(err.issues[0].message);
    }
  }
}
