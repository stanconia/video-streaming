export interface SearchFilters {
  query?: string;
  subject?: string;
  minPrice?: number;
  maxPrice?: number;
  minAge?: number;
  maxAge?: number;
  dateFrom?: string;
  dateTo?: string;
  minRating?: number;
  sortBy?: string;
  sortDir?: string;
  page?: number;
  size?: number;
}

export interface SearchResult<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
