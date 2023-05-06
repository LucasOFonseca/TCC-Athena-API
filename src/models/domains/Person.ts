import { AddressDTO, CreateAddressDTO, GenericStatus } from '../dtos';

export class Person {
  constructor(
    private _name: string,
    private _cpf: string,
    private _birthdate: string,
    private _phoneNumber: string,
    private _email: string,
    private _password: string,
    private _address: CreateAddressDTO | AddressDTO,
    private _status?: GenericStatus,
    private _guid?: string
  ) {}

  get name() {
    return this._name;
  }

  set name(name: string) {
    this._name = name;
  }

  get cpf() {
    return this._cpf;
  }

  set cpf(cpf: string) {
    this._cpf = cpf;
  }

  get birthdate() {
    return this._birthdate;
  }

  set birthdate(birthdate: string) {
    this._birthdate = birthdate;
  }

  get phoneNumber() {
    return this._phoneNumber;
  }

  set phoneNumber(phoneNumber: string) {
    this._phoneNumber = phoneNumber;
  }

  get email() {
    return this._email;
  }

  set email(email: string) {
    this._email = email;
  }

  get password() {
    return this._password;
  }

  set password(password: string) {
    this._password = password;
  }

  get address() {
    return this._address;
  }

  set address(address: CreateAddressDTO | AddressDTO) {
    this._address = address;
  }

  get status() {
    return this._status;
  }

  set status(status: GenericStatus) {
    this._status = status;
  }

  get guid() {
    return this._guid;
  }

  set guid(guid: string) {
    this._guid = guid;
  }
}
