import { z } from 'zod';
import { AppError, ErrorMessages } from '../../infra/http/errors';
import { AddressDTO } from '../dtos';

export class Address {
  constructor(
    private _street: string,
    private _number: string,
    private _neighborhood: string,
    private _city: string,
    private _state: string,
    private _cep: string,
    private _guid?: string
  ) {}

  get guid() {
    return this._guid;
  }

  set guid(guid: string) {
    this._guid = guid;
  }

  get street() {
    return this._street;
  }

  set street(street: string) {
    this._street = street;
  }

  get number() {
    return this._number;
  }

  set number(number: string) {
    this._number = number;
  }

  get neighborhood() {
    return this._neighborhood;
  }

  set neighborhood(neighborhood: string) {
    this._neighborhood = neighborhood;
  }

  get city() {
    return this._city;
  }

  set city(city: string) {
    this._city = city;
  }

  get state() {
    return this._state;
  }

  set state(state: string) {
    this._state = state;
  }

  get cep() {
    return this._cep;
  }

  set cep(cep: string) {
    this._cep = cep;
  }

  toJSON() {
    return {
      guid: this.guid,
      street: this.street,
      number: this.number,
      neighborhood: this.neighborhood,
      city: this.city,
      state: this.state,
      cep: this.cep,
    };
  }

  setAll(data: AddressDTO) {
    this.guid = data.guid;
    this.street = data.street;
    this.number = data.number;
    this.neighborhood = data.neighborhood;
    this.city = data.city;
    this.state = data.state;
    this.cep = data.cep;
  }

  validate() {
    const addressSchema = z
      .object({
        guid: z.string().uuid(),
        cep: z
          .string({ required_error: ErrorMessages.MSGE01 })
          .min(8, ErrorMessages.MSGE08)
          .max(8, ErrorMessages.MSGE09),
        city: z
          .string({ required_error: ErrorMessages.MSGE01 })
          .max(120, ErrorMessages.MSGE09),
        state: z
          .string({ required_error: ErrorMessages.MSGE01 })
          .min(2, ErrorMessages.MSGE08)
          .max(2, ErrorMessages.MSGE09),
        neighborhood: z
          .string({ required_error: ErrorMessages.MSGE01 })
          .max(120, ErrorMessages.MSGE09),
        street: z
          .string({ required_error: ErrorMessages.MSGE01 })
          .max(120, ErrorMessages.MSGE09),
        number: z
          .string({ required_error: ErrorMessages.MSGE01 })
          .max(10, ErrorMessages.MSGE09),
      })
      .partial({ guid: true });

    try {
      addressSchema.parse(this);
    } catch (err) {
      throw new AppError(err.issues[0].message);
    }
  }
}
