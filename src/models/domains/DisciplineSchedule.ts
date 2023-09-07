import { z } from 'zod';
import { AppError } from '../../infra/http/errors';
import { ClassSchedule } from './ClassSchedule';

export class DisciplineSchedule {
  constructor(
    private _employeeGuid: string,
    private _disciplineGuid: string,
    private _schedules: ClassSchedule[],
    private _guid?: string
  ) {}

  get employeeGuid() {
    return this._employeeGuid;
  }

  set employeeGuid(employeeGuid: string) {
    this._employeeGuid = employeeGuid;
  }

  get disciplineGuid() {
    return this._disciplineGuid;
  }

  set disciplineGuid(disciplineGuid: string) {
    this._disciplineGuid = disciplineGuid;
  }

  get schedules() {
    return this._schedules;
  }

  set schedules(schedules: ClassSchedule[]) {
    this._schedules = schedules;
  }

  get guid() {
    return this._guid;
  }

  set guid(guid: string) {
    this._guid = guid;
  }

  toJSON() {
    return {
      guid: this._guid,
      employeeGuid: this._employeeGuid,
      disciplineGuid: this._disciplineGuid,
      schedules: this._schedules,
    };
  }

  validate() {
    const disciplineScheduleSchema = z
      .object({
        guid: z.string().uuid('Guid inválido'),
        employeeGuid: z.string().uuid('Guid inválido'),
        disciplineGuid: z.string().uuid('Guid inválido'),
        schedules: z.array(z.any()),
      })
      .partial({ guid: true, status: true });

    try {
      disciplineScheduleSchema.parse(this);
    } catch (err) {
      throw new AppError(err.issues[0].message);
    }
  }
}
