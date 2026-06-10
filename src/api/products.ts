import { apiRequest } from './client';



export interface ProductListItem {

  id: string;

  name: string;

  price: number;

  formattedQuantity: string;

  fileId?: string | null;

  fileUrl?: string | null;

  company?: { id: string; name: string } | null;

  category?: { id: string; name: string } | null;

}



export interface PaginatedProducts {

  items: ProductListItem[];

  total: number;

  page: number;

  pageSize: number;

  totalPages: number;

}



interface ProductsPagedResponse {

  result: ProductListItem[];

  totalCount?: number;

  page?: number;

  pageSize?: number;

  totalPages?: number;

  TotalCount?: number;

  Page?: number;

  PageSize?: number;

  TotalPages?: number;

}



export interface ProductsFilter {

  companyIds?: string[];

  categoryIds?: string[];

  page?: number;

  pageSize?: number;

}



export async function fetchProducts(params: ProductsFilter = {}): Promise<PaginatedProducts> {

  const query = new URLSearchParams();

  params.companyIds?.forEach((id) => query.append('companyIds', id));

  params.categoryIds?.forEach((id) => query.append('categoryIds', id));

  query.set('page', String(params.page ?? 1));

  query.set('pageSize', String(params.pageSize ?? 20));



  const data = await apiRequest<ProductsPagedResponse>(`/products?${query.toString()}`);

  const total = data.totalCount ?? data.TotalCount ?? 0;

  const page = data.page ?? data.Page ?? params.page ?? 1;

  const pageSize = data.pageSize ?? data.PageSize ?? params.pageSize ?? 20;

  const totalPages = data.totalPages ?? data.TotalPages ?? 0;



  return {

    items: data.result ?? [],

    total,

    page,

    pageSize,

    totalPages: totalPages > 0 ? totalPages : total > 0 ? Math.ceil(total / pageSize) : 0,

  };

}

