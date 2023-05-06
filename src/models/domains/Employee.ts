import { z } from 'zod';
import { validateCPF } from '../../helpers/validators';
import { AppError, ErrorMessages } from '../../infra/http/errors';
import {
  AddressDTO,
  CreateAddressDTO,
  EmployeeRole,
  GenericStatus,
} from '../dtos';
import { Person } from './Person';

export class Employee extends Person {
  constructor(
    private _roles: EmployeeRole[],
    _name: string,
    _cpf: string,
    _birthdate: string,
    _phoneNumber: string,
    _email: string,
    _password: string,
    _address: CreateAddressDTO | AddressDTO,
    _status?: GenericStatus,
    _guid?: string
  ) {
    super(
      _name,
      _cpf,
      _birthdate,
      _phoneNumber,
      _email,
      _password,
      _address,
      _status,
      _guid
    );
  }

  get roles() {
    return this._roles;
  }

  set roles(roles: EmployeeRole[]) {
    this._roles = roles;
  }

  validate() {
    const employeeSchema = z
      .object({
        guid: z.string().uuid('Guid inválido'),
        status: z.enum([GenericStatus.active, GenericStatus.inactive], {
          errorMap: () => new AppError(ErrorMessages.MSGE06),
        }),
        roles: z
          .array(
            z.enum(
              [
                EmployeeRole.coordinator,
                EmployeeRole.educator,
                EmployeeRole.principal,
                EmployeeRole.secretary,
              ],
              {
                errorMap: () => new AppError(ErrorMessages.MSGE06),
              }
            )
          )
          .superRefine((roles, ctx) => {
            const isPrincipal = roles.includes(EmployeeRole.principal);
            const isCoordinator = roles.includes(EmployeeRole.coordinator);
            const isSecretary = roles.includes(EmployeeRole.secretary);

            if (roles.length < 1) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: ErrorMessages.MSGE01,
              });
            }

            if (
              (isPrincipal && isCoordinator) ||
              (isPrincipal && isSecretary) ||
              (isSecretary && isCoordinator)
            ) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: ErrorMessages.MSGE06,
              });
            }
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
      employeeSchema.parse(this);
    } catch (err) {
      throw new AppError(err.issues[0].message);
    }
  }
}
