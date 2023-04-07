import { GenericStatus } from '.';

export interface PaginatedDataRequestDTO {
  query?: string;
  page?: number;
  pageSize?: number;
  filterByStatus?: GenericStatus;
}

export interface PaginatedDataResponseDTO<T> {
  data: T[];
  page: number;
  totalPages: number;
  query?: string;
  filterByStatus?: GenericStatus;
}
