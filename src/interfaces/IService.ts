import { FindAllArgs, FindAllReturn } from '.';

export interface IService {
  create(data: unknown): Promise<unknown>;
  update(guid: string, data: unknown): Promise<unknown>;
  changeStatus(guid: string, status: string): Promise<unknown>;
  list(args?: FindAllArgs | unknown): Promise<FindAllReturn>;
}
