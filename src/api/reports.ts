import type {
  FreeTransportRow,
  ProductRatingRow,
  RejectionReportRow,
  ReportDateFilter,
} from '../types';
import { mockRequest } from './client';

const rejectionData: RejectionReportRow[] = [
  {
    reason: 'Нехватка производственных мощностей (линия перегружена)',
    orderCount: 14,
    sharePercent: 45.2,
  },
  {
    reason: 'Отсутствие необходимого сырья на складе',
    orderCount: 8,
    sharePercent: 25.8,
  },
  {
    reason: 'Срыв сроков согласования с заказчиком',
    orderCount: 5,
    sharePercent: 16.1,
  },
  {
    reason: 'Техническое обслуживание оборудования',
    orderCount: 4,
    sharePercent: 12.9,
  },
];

const productRatingData: ProductRatingRow[] = [
  { rank: 1, name: 'Круассан с кремом', orderCount: 542 },
  { rank: 2, name: 'Торт «Прага»', orderCount: 380 },
  { rank: 3, name: 'Булочка с маком', orderCount: 315 },
  { rank: 4, name: 'Пирожное «Картошка»', orderCount: 290 },
  { rank: 5, name: 'Рулет швейцарский', orderCount: 110 },
];

const freeTransportData: FreeTransportRow[] = [
  {
    driver: 'Иванов П.С.',
    vehicle: 'КАМАЗ',
    licensePlate: 'А123БВ',
    city: 'Москва',
    availableSince: '26.05.2026, 09:15',
  },
  {
    driver: 'Сидоров А.В.',
    vehicle: 'МАЗ',
    licensePlate: 'В456ГД',
    city: 'Тверь',
    availableSince: '26.05.2026, 11:40',
  },
  {
    driver: 'Новиков Д.А.',
    vehicle: 'Scania R',
    licensePlate: 'К012ЛМ',
    city: 'Казань',
    availableSince: '25.05.2026, 18:05',
  },
];

export async function fetchRejectionReport(
  _filter: ReportDateFilter,
): Promise<RejectionReportRow[]> {
  return mockRequest([...rejectionData]);
}

export async function fetchProductRatingReport(
  _filter: ReportDateFilter,
): Promise<ProductRatingRow[]> {
  return mockRequest([...productRatingData]);
}

export async function fetchFreeTransportReport(
  _filter: ReportDateFilter,
): Promise<FreeTransportRow[]> {
  return mockRequest([...freeTransportData]);
}
