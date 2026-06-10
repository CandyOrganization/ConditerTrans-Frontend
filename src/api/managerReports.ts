import { apiRequest } from './client';
import type { ReportDateFilter } from '../types';

export interface PartnerDeadlineCompliance {
  ordersWithAgreedDate: number;
  onTimeCount: number;
  lateCount: number;
  onTimePercent: number;
  averageDelayDays: number;
}

export interface PartnerSupplyQuality {
  rescheduledOrdersCount: number;
  reschedulePercent: number;
  qualityPercent: number;
}

export interface ManagerPartnerReliabilityReport {
  companyId: string;
  companyName: string;
  partnerType: 'Production' | 'Transport' | string;
  periodFrom?: string | null;
  periodTo?: string | null;
  completedOrdersCount: number;
  deadlineCompliance: PartnerDeadlineCompliance;
  supplyQuality: PartnerSupplyQuality;
}

interface PartnerReliabilityApiResponse {
  companyId: string;
  companyName: string;
  partnerType: string;
  periodFrom?: string | null;
  periodTo?: string | null;
  completedOrdersCount: number;
  deadlineCompliance: {
    ordersWithAgreedDate: number;
    onTimeCount: number;
    lateCount: number;
    onTimePercent: number;
    averageDelayDays: number;
  };
  supplyQuality: {
    rescheduledOrdersCount: number;
    reschedulePercent: number;
    qualityPercent: number;
  };
}

export interface PartnerReliabilityFilter extends ReportDateFilter {
  companyId: string;
  /** production | transport — для компаний с типом «производство», но ролью логистики */
  partnerType?: 'production' | 'transport';
}

export async function fetchManagerPartnerReliabilityReport(
  filter: PartnerReliabilityFilter,
): Promise<ManagerPartnerReliabilityReport> {
  const query = new URLSearchParams();
  query.set('companyId', filter.companyId);
  if (filter.dateFrom) {
    query.set('dateFrom', filter.dateFrom);
  }
  if (filter.dateTo) {
    query.set('dateTo', filter.dateTo);
  }
  if (filter.partnerType) {
    query.set('partnerType', filter.partnerType);
  }

  const data = await apiRequest<PartnerReliabilityApiResponse>(
    `/orders/manager/reports/partner-reliability?${query.toString()}`,
  );

  return {
    companyId: data.companyId,
    companyName: data.companyName,
    partnerType: data.partnerType,
    periodFrom: data.periodFrom,
    periodTo: data.periodTo,
    completedOrdersCount: data.completedOrdersCount,
    deadlineCompliance: {
      ordersWithAgreedDate: data.deadlineCompliance.ordersWithAgreedDate,
      onTimeCount: data.deadlineCompliance.onTimeCount,
      lateCount: data.deadlineCompliance.lateCount,
      onTimePercent: data.deadlineCompliance.onTimePercent,
      averageDelayDays: data.deadlineCompliance.averageDelayDays,
    },
    supplyQuality: {
      rescheduledOrdersCount: data.supplyQuality.rescheduledOrdersCount,
      reschedulePercent: data.supplyQuality.reschedulePercent,
      qualityPercent: data.supplyQuality.qualityPercent,
    },
  };
}
