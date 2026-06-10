import { apiRequest } from './client';

export interface CompanyShortItem {
  id: string;
  name: string;
}

export async function fetchManagerProductionCompanies(): Promise<CompanyShortItem[]> {
  return apiRequest<CompanyShortItem[]>('/companies/manager/production');
}
