import type { ProductRatingRow, RejectionReportRow, ReportDateFilter } from '../types';
import { apiRequest, ApiError } from './client';
import { fetchProductRatingReport, fetchRejectionReport } from './reports';

const REFUSALS_PATH = '/orders/dispatcher/reports/refusals';
const RATING_PATH = '/orders/dispatcher/reports/product-rating';

interface RefusalsApiResponse {
  result: RejectionReportRow[];
}

interface RatingApiResponse {
  result: ProductRatingRow[];
}

async function withReportMock<T>(apiCall: () => Promise<T>, mockFn: () => Promise<T>): Promise<T> {
  try {
    return await apiCall();
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return mockFn();
    }
    throw err;
  }
}

function buildQuery(filter: ReportDateFilter): string {
  const query = new URLSearchParams();
  if (filter.dateFrom.trim()) {
    query.set('dateFrom', filter.dateFrom.trim());
  }
  if (filter.dateTo.trim()) {
    query.set('dateTo', filter.dateTo.trim());
  }
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

export async function fetchDispatcherRejectionReport(
  filter: ReportDateFilter,
): Promise<RejectionReportRow[]> {
  return withReportMock(
    async () => {
      const data = await apiRequest<RefusalsApiResponse>(
        `${REFUSALS_PATH}${buildQuery(filter)}`,
      );
      return data.result ?? [];
    },
    () => fetchRejectionReport(filter),
  );
}

export async function fetchDispatcherProductRatingReport(
  filter: ReportDateFilter,
): Promise<ProductRatingRow[]> {
  return withReportMock(
    async () => {
      const data = await apiRequest<RatingApiResponse>(`${RATING_PATH}${buildQuery(filter)}`);
      return data.result ?? [];
    },
    () => fetchProductRatingReport(filter),
  );
}
