import { AddressDTO, CreateAddressDTO, GenericStatus } from '.';

export interface CreateStudentDTO {
  name: string;
  cpf: string;
  email: string;
  address: CreateAddressDTO;
  birthdate: string;
  phoneNumber: string;
}

export interface StudentDTO extends CreateStudentDTO {
  guid: string;
  status: GenericStatus;
  address: AddressDTO;
}

export interface UpdateStudentDTO {
  guid?: string;
  status?: GenericStatus;
  name?: string;
  cpf?: string;
  email?: string;
  address?: AddressDTO;
  birthdate?: string;
  phoneNumber?: string;
  password?: string;
}
