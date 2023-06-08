import { GenericStatus } from '.';

export interface MatrixModuleDisciplineDTO {
  guid: string;
  name: string;
  workload: number;
}

export interface MatrixModuleDTO {
  guid?: string;
  name: string;
  disciplines: MatrixModuleDisciplineDTO[];
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
