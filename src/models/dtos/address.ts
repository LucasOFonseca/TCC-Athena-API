export interface CreateAddressDTO {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
}

export interface AddressDTO extends CreateAddressDTO {
  guid: string;
}
