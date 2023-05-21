import { GenericStatus } from '.';

export interface MatrixModuleDTO {
  guid?: string;
  name: string;
  disciplines: string[];
}

export interface CreateMatrixDTO {
  name: string;
  courseGuid: string;
  modules: MatrixModuleDTO[];
}

export interface MatrixBaseDTO {
  guid: string;
  status: GenericStatus;
  name: string;
}

export interface MatrixDTO extends MatrixBaseDTO {
  courseGuid: string;
  modules: MatrixModuleDTO[];
}

export interface UpdateMatrixDTO {
  guid?: string;
  status?: GenericStatus;
  name?: string;
  courseGuid?: string;
  modules?: MatrixModuleDTO[];
}
