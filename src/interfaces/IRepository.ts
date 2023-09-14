export type FindAllArgs = {
  skip?: number;
  take?: number;
  searchTerm?: string;
  filterByStatus?: string;
  itemsToExclude?: string[];
};

export type FindAllReturn = {
  data: unknown[];
  totalItems: number;
};

export interface IRepository {
  create(data: unknown): Promise<unknown>;
  update(guid: string, data: unknown): Promise<unknown>;
  findAll(args?: FindAllArgs | unknown): Promise<FindAllReturn>;
}
