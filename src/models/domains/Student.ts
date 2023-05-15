import { z } from 'zod';
import { validateCPF } from '../../helpers/validators';
import { AppError, ErrorMessages } from '../../infra/http/errors';
import { GenericStatus } from '../dtos';
import { Person } from './Person';

export class Student extends Person {
  validate() {
    const studentSchema = z
      .object({
        guid: z.string().uuid('Guid inválido'),
        status: z.enum([GenericStatus.active, GenericStatus.inactive], {
          errorMap: () => new AppError(ErrorMessages.MSGE06),
        }),
        name: z
          .string({ required_error: ErrorMessages.MSGE01 })
          .min(3, ErrorMessages.MSGE08)
          .max(120, ErrorMessages.MSGE09),
        cpf: z
          .string({ required_error: ErrorMessages.MSGE01 })
          .min(11, ErrorMessages.MSGE08)
          .max(11, ErrorMessages.MSGE09)
          .refine((cpf) => validateCPF(cpf), ErrorMessages.MSGE12),
        birthdate: z
          .string({ required_error: ErrorMessages.MSGE01 })
          .datetime({ message: ErrorMessages.MSGE06 }),
        phoneNumber: z
          .string({ required_error: ErrorMessages.MSGE01 })
          .min(11, ErrorMessages.MSGE08)
          .max(11, ErrorMessages.MSGE09),
        email: z
          .string({ required_error: ErrorMessages.MSGE01 })
          .email(ErrorMessages.MSGE06),
        password: z
          .string({ required_error: ErrorMessages.MSGE01 })
          .min(8, ErrorMessages.MSGE08),
      })
      .partial({ guid: true, status: true });

    try {
      studentSchema.parse(this);
    } catch (err) {
      throw new AppError(err.issues[0].message);
    }
  }
}
