import type { Application, ProcessApplicationDto } from '../types';
import {
  assignDriverToCargo,
  fetchPendingCargosPaged,
  formatApplicationLabel,
  formatApplicationRoute,
  mapCargoToApplication,
  type CargoListFilter,
  type PaginatedCargoList,
} from './cargo';

export { formatApplicationLabel, formatApplicationRoute };

export async function fetchApplicationsPaged(
  params: CargoListFilter = {},
): Promise<PaginatedCargoList & { applications: Application[] }> {
  const page = await fetchPendingCargosPaged(params);
  return {
    ...page,
    applications: page.items.map(mapCargoToApplication),
  };
}

export async function fetchApplications(params?: CargoListFilter): Promise<Application[]> {
  const page = await fetchApplicationsPaged(params);
  return page.applications;
}

export async function processApplication(
  id: string,
  payload: ProcessApplicationDto,
): Promise<void> {
  await assignDriverToCargo(id, payload);
}
