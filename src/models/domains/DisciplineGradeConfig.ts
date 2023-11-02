import { z } from 'zod';
import { AppError, ErrorMessages } from '../../infra/http/errors';
import { GradeItemDTO } from '../dtos';

export class DisciplineGradeConfig {
  constructor(private _gradeItems: GradeItemDTO[], private _guid?: string) {}

  get gradeItems() {
    return this._gradeItems;
  }

  set gradeItems(gradeItems: GradeItemDTO[]) {
    this._gradeItems = gradeItems;
  }

  get guid() {
    return this._guid;
  }

  set guid(guid: string) {
    this._guid = guid;
  }

  toJSON() {
    return {
      gradeItems: this.gradeItems,
      guid: this.guid,
    };
  }

  validate() {
    const disciplineGradeConfigSchema = z
      .object({
        guid: z.string().uuid('Guid inválido'),
        gradeItems: z.array(z.any()).min(1, ErrorMessages.MSGE10),
      })
      .partial({ guid: true });

    try {
      disciplineGradeConfigSchema.parse(this);
    } catch (err) {
      throw new AppError(err.issues[0].message);
    }
  }
}
