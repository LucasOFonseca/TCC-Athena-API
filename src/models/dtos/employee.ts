import { AddressDTO, CreateAddressDTO, EmployeeRole, GenericStatus } from '.';

export interface CreateEmployeeDTO {
  name: string;
  cpf: string;
  email: string;
  address: CreateAddressDTO;
  roles: EmployeeRole[];
  birthdate: string;
  phoneNumber: string;
}

export interface EmployeeDTO extends CreateEmployeeDTO {
  guid: string;
  status: GenericStatus;
  address: AddressDTO;
}

export interface UpdateEmployeeDTO {
  guid?: string;
  status?: GenericStatus;
  name?: string;
  cpf?: string;
  email?: string;
  address?: AddressDTO;
  roles?: EmployeeRole[];
  birthdate?: string;
  phoneNumber?: string;
  password?: string;
}
