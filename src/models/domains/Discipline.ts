import { z } from 'zod';
import { AppError, ErrorMessages } from '../../infra/http/errors';
import { GenericStatus } from '../dtos';

export class Discipline {
  constructor(
    private _name: string,
    private _syllabus: string,
    private _workload: number,
    private _guid?: string,
    private _status?: GenericStatus
  ) {}

  get name() {
    return this._name;
  }

  get syllabus() {
    return this._syllabus;
  }

  get workload() {
    return this._workload;
  }

  get guid() {
    return this._guid;
  }

  get status() {
    return this._status;
  }

  set guid(guid: string) {
    this._guid = guid;
  }

  set status(status: GenericStatus) {
    this._status = status;
  }

  set name(name: string) {
    this._name = name;
  }

  set syllabus(syllabus: string) {
    this._syllabus = syllabus;
  }

  set workload(workload: number) {
    this._workload = workload;
  }

  toJSON() {
    return {
      name: this.name,
      syllabus: this.syllabus,
      workload: this.workload,
      guid: this.guid,
      status: this.status,
    };
  }

  validate() {
    const disciplineSchema = z
      .object({
        guid: z.string().uuid('Guid inválido'),
        status: z.enum([GenericStatus.active, GenericStatus.inactive], {
          errorMap: () =>
            new AppError(`'${this._status}' não é um status válido`),
        }),
        name: z
          .string({ required_error: ErrorMessages.requiredFields })
          .min(3, 'Nome deve conter pelo menos 3 caracteres')
          .max(120, 'Nome não deve ser maior que 120 caracteres'),
        syllabus: z
          .string({ required_error: ErrorMessages.requiredFields })
          .min(3, 'Ementa deve conter pelo menos 3 caracteres')
          .max(500, 'Ementa não deve ser maior que 500 caracteres'),
        workload: z
          .number({
            required_error: ErrorMessages.requiredFields,
          })
          .min(1, 'Carga horária não deve ser menor que 1')
          .max(999, 'Carga horária não deve ser maior que 999'),
      })
      .partial({ guid: true, status: true });

    try {
      disciplineSchema.parse(this);
    } catch (err) {
      throw new AppError(err.issues[0].message);
    }
  }
}
