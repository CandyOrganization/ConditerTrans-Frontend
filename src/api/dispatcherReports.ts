import type { ProductRatingRow, RejectionReportRow, ReportDateFilter } from '../types';
import { apiRequest } from './client';

const REFUSALS_PATH = '/orders/dispatcher/reports/refusals';
const RATING_PATH = '/orders/dispatcher/reports/product-rating';

interface RefusalsApiResponse {
  result: RejectionReportRow[];
}

interface RatingApiResponse {
  result: ProductRatingRow[];
}

interface RefusalsApiRow {
  reason: string;
  orderCount: number;
  sharePercent: number;
  Reason?: string;
  OrderCount?: number;
  SharePercent?: number;
}

interface RatingApiRow {
  rank: number;
  name: string;
  orderCount: number;
  Rank?: number;
  Name?: string;
  OrderCount?: number;
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

function mapRejectionRow(row: RefusalsApiRow): RejectionReportRow {
  return {
    reason: row.reason ?? row.Reason ?? '—',
    orderCount: row.orderCount ?? row.OrderCount ?? 0,
    sharePercent: row.sharePercent ?? row.SharePercent ?? 0,
  };
}

function mapRatingRow(row: RatingApiRow): ProductRatingRow {
  return {
    rank: row.rank ?? row.Rank ?? 0,
    name: row.name ?? row.Name ?? '—',
    orderCount: row.orderCount ?? row.OrderCount ?? 0,
  };
}

export async function fetchDispatcherRejectionReport(
  filter: ReportDateFilter,
): Promise<RejectionReportRow[]> {
  const data = await apiRequest<RefusalsApiResponse>(`${REFUSALS_PATH}${buildQuery(filter)}`);
  return (data.result ?? []).map(mapRejectionRow);
}

export async function fetchDispatcherProductRatingReport(
  filter: ReportDateFilter,
): Promise<ProductRatingRow[]> {
  const data = await apiRequest<RatingApiResponse>(`${RATING_PATH}${buildQuery(filter)}`);
  return (data.result ?? []).map(mapRatingRow);
}
